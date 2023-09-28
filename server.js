// Check if it's in production or not
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

// Sets the passing grade
const passingGrade = 75
const quarters = [1, 2, 3, 4]

// Imports all the module
const express = require('express')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const crypto = require('crypto')
const { PrismaClient } = require("@prisma/client")
const DecisionTree = require('decision-tree')

const prisma = new PrismaClient()
const app = express()
const initializePassport = require('./passport-config')
// Setting the passport module to find in the user in database
initializePassport(
    passport,
    async teacherEmail => {
        const findTeacher = await prisma.teacher.findUnique({
            where:{
                email: teacherEmail
            }
        })
    },
    async teacherId => {
        const findTeacher = await prisma.teacher.findUnique({
            where:{
                id: teacherId
            }
        })
    }
)

app.use(express.static(__dirname + '/public'))
app.set('view-engine', 'ejs')
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.urlencoded())
app.use(express.json())

// URL endpoint for the index.ejs
// "app" is using the express framework to easily create routing and endpoints in the nodeJS
// app."get/post" is to determine if this endpoint is get method or post method
// app.get(<endpoint>, <middleware>, <function>)
// <endpoint> - Is the url endpoint for it to access your function
// <middleware> - onlyNotAuthenticated and onlyAuthenticated are middlewares, before
//                accessing the function it will first process the middleware to make sure that only authorize or non-authorize can access the system
// <function> - This is the part where there's a (req, res)
//              req - is request, it contains the data sent from the front end
//              res - is respond, this is where you'll respond to what will happen
//                  res.render() is to render which html should show
//                  res.redirect() is to redirect on which endpoint should be next
//                  res.send() is to return a data to the front end
//              in the render part, you can send a data to the front end by using this
//              method: res.render('linkToHTMLFile.ejs', {key: value, key2: value2, value3, ...})
// async is for the function to wait for everything before finishing using the await keyword
// await keyword is used to not proceed to the next line without finishing or receiving a data

app.get('/card-inside/:studentId', onlyAuthenticated, async (req, res) => {
    var data = await getStudentGradeByStudentId(req.params.studentId)
    res.render('pages/card-inside.ejs',{
        data
    })
})

app.get('/card-outside/:studentId', onlyAuthenticated, async (req, res) => {
    if(isNaN(parseInt(req.params.studentId))){
        res.redirect('/dashboard')
    }
    var finalStudentId = parseInt(req.params.studentId)
    var student = await prisma.student.findUnique({where:{id: Number(finalStudentId)}})
    res.render('pages/card-outside.ejs',{
        student
    })
})

app.get('/', onlyNotAuthenticated, async (req, res) => {
    res.render('pages/index.ejs')
})

app.get('/admin', async (req, res) => {
    var teachers = await getTeachers()
    var classrooms = await getClasses()
    var types = await getTypes()
    var sy = await getCurrentSchoolYear()
    var listOfSy = await getSchoolYears()
    var gradeLevels = await getGradeLevels()
    
    var hasCurrent = false
    for(var i = 0; i < listOfSy.length; i++){
        hasCurrent = listOfSy[i].isCurrent
        if(hasCurrent){
            break
        }
    }

    res.render('pages/admin.ejs', {
        teachers,
        classrooms,
        types,
        sy,
        hasCurrent,
        gradeLevels
    })
})

app.get('/admin/class/:id', async (req, res) => {
    var classId = req.params.id
    var classroom = await getClassByIdAndSyId(classId, 0)
    res.render('pages/adminClassPage.ejs', {
        classroom,
        classId
    })
})

app.get('/admin/class-students/:classId', async (req, res) => {
    var classId = req.params.classId
    res.render('pages/adminClassStudentsPage.ejs', {
        classId
    })
})

app.get('/dashboard/', onlyAuthenticated, async (req, res) => {
    res.redirect('/dashboard/default')
})

app.get('/dashboard/:syId', onlyAuthenticated, async (req, res) => {
    if(isNaN(req.params.syId)){
        var sy = await getCurrentSchoolYear()
        res.redirect('/dashboard/' + sy.id)
        return
    }

    var teacherId = req.session.passport.user // Get Teacher
    var sy =  await getSchoolYear(req.params.syId)

    var classId = await getClassIdByTeacherId(teacherId)
    // var advisory = await getClassByTeacherIdAndSyId(teacherId, sy.id) // Get Class of Teacher
    var advisory = await getAdvisoryByClassIdAndSchoolYearId(classId, sy.id)

    var grades = await getAllGradesByClass(advisory)
    res.render('pages/dashboard.ejs', {
        advisory,
        grades,
        sy
    })
})
//TEMPORARY FUNCTION
async function getClassIdByTeacherId(teacherId){
    var teacher = await prisma.teacher.findFirst({
        where:{
            id: Number(teacherId)
        },
        include:{
            class: true
        }
    })
    return teacher.class.id
}

async function getAdvisoryByClassIdAndSchoolYearId(classId, schoolYearId){
    var data = await prisma.schoolRecord.findMany({
        where:{
            AND:[
                { classId: Number(classId) },
                { schoolYearId: Number(schoolYearId) }
            ]
        },
        select:{
            student:{
                include:{
                    scores: true
                }
            }
        }
    })
    var students = []
    for(var i = 0; i < data.length; i++){
        var currentData = data[i]
        students.push(currentData.student)
    }
    var advisoryClass = await prisma.class.findFirst({
        where:{
            id: classId
        },
        include:{
            students:{
                include:{
                    scores: true
                }
            },
            subjects:{
                include:{
                    subjectTeacher: true
                }
            },
            grade: true
        }
    })
    advisoryClass.students = students
    return advisoryClass
}

app.get('/dashboard/:syId/class-grades', onlyAuthenticated, async (req, res) => {
    var teacherId = req.session.passport.user
    var sy = await getSchoolYear(req.params.syId)
    
    var classId = await getClassIdByTeacherId(teacherId)
    // var thisClassOld = await getClassByTeacherIdAndSyId(teacherId, req.params.syId)
    var thisClass = await getAdvisoryByClassIdAndSchoolYearId(classId, sy.id)
    var studentsData = await getPredictionGradesOfStudentsByClassIdAndSyId(thisClass.id, req.params.syId)
    res.render('pages/class-grades.ejs', {
        studentsData
    })
})

app.get('/subjects', onlyAuthenticated, async (req, res) => {
    var teacherId = req.session.passport.user
    var relatedClasses = await getClassesForSubjectTeacherByTeacherId(teacherId)
    var types = await getTypes()
    res.render('pages/subjects.ejs', {
        relatedClasses,
        types
    })
})

app.get('/profile', onlyAuthenticated, async (req, res) => {
    var teacherId = req.session.passport.user
    var teacher = await getTeacherByTeacherId(teacherId)

    res.render('pages/profile.ejs', {
        teacher
    })
})

app.get('/api/get-teachers', async (req, res) => {
    var teachers = await getTeachers()
    res.send({teachers})
})

app.get('/api/get-school-years', async (req, res) => {
    var sys = await getSchoolYears()
    res.send({sys})
})

app.get('/api/get-elementary-record/:studentId', async (req, res) => {
    var studentId = req.params.studentId
    var student = await prisma.student.findFirst({where:{id:Number(studentId)}})
    var perGradeData = {}
    for(var i = 1; i <= 6; i++){
        var grades = []
        var currentClass = await getClassByGradeAndStudentId(i, studentId)
        if(currentClass == null){
            continue
        }

        grades = await getClassGrades(currentClass, studentId)
        perGradeData['grade' + i] = {}
        perGradeData['grade' + i]['grades'] = grades
        perGradeData['grade' + i]['class'] = currentClass
    }
    res.send({ perGradeData, student })
})

//TEMPORARY FUNCTION
async function getClassGrades(currentClass, studentId){
    var subjects = currentClass.class.subjects
    var allGrades = []
    for(var i = 0; i < subjects.length; i++){
        var subject = subjects[i]
        var subjectGrade = await computeGradeBySubject(currentClass.schoolYearId, subject, studentId)
        allGrades.push(subjectGrade)
    }
    return allGrades
}

async function computeGradeBySubject(syId, subject, studentId){
    var grade = 0
    var sy = await getSchoolYear(syId)

    var scores = await getScoresByStudentSubjectSchoolYearId(studentId, subject.id, sy.id)
    var types = await getTypes()
    for(var i = 0; i < types.length; i++){
        var percentage = Number(types[i].percentage) * 0.01
        var totalScore = 0
        var totalItems = 0
        for(var j = 0; j < scores.length; j++){
            if(types[i].id == scores[j].activity.typeId){
                totalScore += scores[j].score
                totalItems += scores[j].activity.totalItems
            }
        }
        
        grade += totalScore == 0 && totalItems == 0 ? 0 : ((totalScore / totalItems) * percentage) * 100
    }

    var gradeObject = {
        subjectTeacher: subject.subjectTeacher,
        subject: subject.name,
        grade: grade
    }
    return gradeObject
}

// app.get('/api-test', async (req, res) => {
//     var scores = await prisma.score.findMany({
//         where:{
//             AND:[
//                 { studentId: 9 },
//                 { activity: {
//                     subjectId: 3
//                 } },
//                 { activity: {
//                     schoolYearId: 2
//                 } }
//             ]
//         },
//         include:{
//             activity:{
//                 include:{
//                     type: true
//                 }
//             }
//         }
//     })
//     console.log(scores)
//     res.send(scores)
// })

async function getScoresByStudentSubjectSchoolYearId(studentId, subjectId, syId){
    return await prisma.score.findMany({
        where:{
            AND:[
                { studentId: Number(studentId) },
                { activity: {
                    subjectId: Number(subjectId)
                } },
                { activity: {
                    schoolYearId: Number(syId)
                } }
            ]
        },
        include:{
            activity:{
                include:{
                    type: true
                }
            }
        }
    })
}

async function getClassByGradeAndStudentId(gradeLevel, studentId){
    var record = await prisma.schoolRecord.findMany({
        where:{
            studentId: Number(studentId)
        },
        include:{
            class:{
                include:{
                    grade: true,
                    subjects: {
                        include:{
                            subjectTeacher: true
                        }
                    }
                }
            }
        }
    })
    for(var i = 0; i < record.length; i++){
        var currentRecord = record[i]
        if(currentRecord.class.grade.gradeLevel == gradeLevel){
            return currentRecord
        }
    }
    return null
}

app.delete('/logout', async (req, res) => {
    req.logout((err) => {
        if(err){
            console.log(err)
        }    
        res.redirect('/')
    })
})

app.post('/login', checkAdmin, onlyNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/dashboard/default',
    failureRedirect: '/',
    failureFlash: true
}))

app.post('/add-teacher', async (req, res) => {
    var teacher = {
        email: req.body.email,
        name: req.body.fullName,
        password: generateRandomString(10)
    }
    await saveTeacher(teacher, null)
    res.end()
})

app.post('/add-class', async (req, res) => {
    var gradeLevelId = req.body.gradeLevelId
    var section = req.body.section
    var adviserId = String(req.body.adviser).split('-')[0]
    await saveClass(gradeLevelId, section, adviserId, null)
    res.end()
})

app.post('/add-subject/:classId', async (req, res) => {
    var subjectName = req.body.subject
    var teacherId = String(req.body.teacher).split('-')[0]
    var classId = req.params.classId
    await saveSubject(subjectName, teacherId, classId, null)
    res.end()
})

app.post('/add-student/:syId', onlyAuthenticated, async (req, res) => {
    var teacherId = req.session.passport.user 
    var advisory = await getClassByTeacherIdAndSyId(teacherId, req.params.syId)
    var student = {
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        sex: req.body.sex,
        classId: Number(advisory.id)
    }
    var syId = req.params.syId
    saveStudent(student, syId, null)
    res.redirect('/dashboard')
})

app.post('/add-type', async (req, res) => {
    var name = req.body.name
    var percentage = req.body.percentage
    saveType(name, percentage, null)
    res.redirect('/admin')
})

app.post('/add-activity/:subjectId/:quarter', async (req, res) => {
    var activityName = req.body.activity
    var total = req.body.total
    var typeId = req.body.type
    var subjectId = req.params.subjectId
    var quarter = req.params.quarter

    if(activityName == '' || total == ''){
        res.redirect('/subjects')
        return
    }

    if(await examLimitReached(subjectId, typeId, quarter)){
        res.redirect('/subjects')
        return
    }

    saveActivity(activityName, total, subjectId, typeId, quarter, null)
    res.redirect('/subjects')
})

app.post('/add-scores', async (req, res) => {
    var scores = req.body.scores
    var finalScores = []
    for(var i = 0; i < scores.length; i++){
        var currentScore = scores[i]
        var total = await getTotalItemsByActivityId(currentScore.activityId)
        var newScore = {
            score: Number(currentScore.score) > total ? total : Number(currentScore.score),
            activityId: Number(currentScore.activityId),
            studentId: Number(currentScore.studentId)
        }
        finalScores.push(newScore)
    }
    saveManyScores(finalScores)
    res.redirect('/subjects')
})

app.post('/delete-teacher/:id', async (req, res) => {
    await prisma.teacher.delete({
        where:{
            id: Number(req.params.id)
        }
    })
    res.redirect('/admin')
})

app.post('/delete-class/:id', async (req, res) => {
    await prisma.class.delete({
        where:{
            id: Number(req.params.id)
        }
    })
    res.redirect('/admin')
})

app.post('/delete-subject/:id', async (req, res) => {
    await prisma.subject.delete({
        where:{
            id: Number(req.params.id)
        }
    })
    res.end()
})

app.post('/delete-type/:id', async (req, res) => {
    await prisma.type.delete({
        where:{
            id: Number(req.params.id)
        }
    })
})

app.post('/delete-activity/:id', async (req, res) => {
    await prisma.activity.delete({
        where:{
            id: Number(req.params.id)
        }
    })
})

app.post('/api-get-scores/:activityId', async (req, res) => {
    var activityId = req.params.activityId
    var scores = await getScoresByActivityId(activityId)
    res.send({
        scores
    })
})

app.post('/change-password', async (req, res) => {
    var teacherId = req.session.passport.user
    var newPassword = req.body.password

    var teacher = await getTeacherByTeacherId(teacherId)
    teacher.password = newPassword

    saveTeacher(teacher, teacher.id)
    res.redirect('/profile')
})

app.post('/save-school-year', async (req, res) => {
    var schoolYear = req.body.schoolYear
    await prisma.schoolYear.create({
        data:{
            title: schoolYear,
            isCurrent: false
        }
    })
    res.redirect('/admin')
})

app.post('/change-current-year', async (req, res) => {
    var syId = req.body.schoolYearId
    await changeCurrentSchoolYearById(syId)
    await newSchoolYear()
    res.redirect('/admin')
})

app.post('/delete-school-year/:syId', async (req, res) => {
    await prisma.schoolYear.delete({
        where:{
            id: Number(req.params.syId)
        }
    })
    res.redirect('/admin')
})

app.post('/search-student', async (req, res) => {
    var idNumber = req.body.idNumber
    var lName = req.body.lName
    var fName = req.body.fName
    var mName = req.body.mName
    var dataResult = await searchStudent(idNumber, lName, fName, mName)
    res.send({dataResult})
})

app.post('/save-student', async (req, res) => {
    var student = {}
    student.id = req.body.id
    student.lastName = req.body.lName
    student.firstName = req.body.fName
    student.middleName = req.body.mName
    student.birthDate = req.body.birthDate
    student.sex = req.body.sex
    await saveStudent(student)
    res.end()
})

app.post('/delete-student', async (req, res) => {
    var id = req.body.id
    await prisma.student.delete({
        where: {
            id: Number(id)
        }
    })
    res.end()
})

app.post('/search-teacher', async (req, res) => {
    var email = req.body.email
    var fullName = req.body.fullName
    var dataResult = await searchTeacher(email, fullName)
    res.send({dataResult})
})

app.post('/search-class', async (req, res) => {
    var gradeLevelId = req.body.gradeLevel
    var section = req.body.section
    var dataResult = await searchClass(gradeLevelId, section)
    res.send({dataResult})
})

app.post('/search-subject/:classId', async (req, res) => {
    var subjectName = req.body.subject
    var classId = req.params.classId
    var dataResult = await searchSubject(classId, subjectName)
    res.send({dataResult})
})

app.post('/get-class-student/:classId', async (req, res) => {
    var classId = req.params.classId
    var dataResult = await getClassStudents(classId)
    res.send({dataResult})
})

app.post('/search-unassigned-student', async (req, res) => {
    var name = req.body.name
    var dataResult = await searchUnassignedStudents(name)
    res.send({dataResult})
}) 

app.post('/assign-student/:classId', async (req, res) => {
    var classId = req.params.classId
    var studentId = String(req.body.student).split("-")[0]
    await assignStudent(classId, studentId)
    res.end()
})

app.post('/unassign-student/:classId', async (req, res) => {
    var classId = req.params.classId
    var studentId = req.body.studentId
    await unassignStudent(classId, studentId)
    res.end()
})

// DATABASE FUNCTIONS

//NEWLY ADDED FUNCTIONS
async function searchStudent(id, lName, fName, mName){
    if(Number(id) == 0){
        return await prisma.student.findMany({
            where:{
                AND:[
                    { lastName: {contains: lName} },
                    { firstName: {contains: fName} },
                    { middleName: {contains: mName} }
                ]
            }
        })
    }
    return await prisma.student.findMany({
        where:{
            AND:[
                { id: Number(id) },
                { lastName: {contains: lName} },
                { firstName: {contains: fName} },
                { middleName: {contains: mName} }
            ]
        }
    })
}

async function saveStudent(student){
    await prisma.student.upsert({
        create:{
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            birthDate: student.birthDate,
            sex: student.sex
        },
        update:{
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            birthDate: student.birthDate,
            sex: student.sex
        },
        where:{
            id: Number(student.id)
        }
    })
    return true
}

async function searchTeacher(email, fullName){
    return await prisma.teacher.findMany({
        where:{
            AND:[
                { email: { contains: email } },
                { name: { contains: fullName } }
            ]
        }
    })
}

async function searchClass(gradeLevelId, section){
    return await prisma.class.findMany({
        where:{
            AND:[
                { 
                    grade: { 
                        id: Number(gradeLevelId) 
                    } 
                },
                { section: { contains: section } }
            ]
        },
        include:{
            grade: true,
            adviser: true,
            students: true
        }
    })
}

async function searchSubject(classId, subjectName){
    return await prisma.subject.findMany({
        where:{
            AND:[
                { classId: Number(classId) },
                { name: { contains: subjectName } }
            ]
        },
        include:{
            subjectTeacher: true
        }
    })
}

async function getClassStudents(classId){
    return await prisma.student.findMany({
        where:{
                classId: Number(classId)
        },
        orderBy:{
            lastName: 'asc'
        }
    })
}

async function searchUnassignedStudents(name){
    return await prisma.student.findMany({
        where:{
            AND:[
                { classId: null },
                { lastName: { contains: name } },
                { firstName: { contains: name } },
                { middleName: { contains: name } }
            ]
        }
    })
}

async function assignStudent(classId, studentId){
    var sy = await getCurrentSchoolYear()
    await prisma.schoolRecord.create({
        data:{
            classId: Number(classId),
            studentId: Number(studentId),
            schoolYearId: Number(sy.id)
        }
    })
    await prisma.student.update({
        data:{
            classId: Number(classId)
        },
        where:{
            id: Number(studentId)
        }
    })
}

async function unassignStudent(classId, studentId){
    await prisma.schoolRecord.deleteMany({
        where:{
            AND:[
                { classId: Number(classId) },
                { studentId: Number(studentId) }
            ]
        }
    })
    await prisma.student.update({
        data:{
            classId: null
        },
        where:{
            id: Number(studentId)
        }
    })
}

async function newSchoolYear(){
    await prisma.student.updateMany({
        data:{
            classId: null
        },
        where:{
            NOT:{
                id: undefined
            }
        }
    })
}

//OLD FUNCTIONS
async function saveClass(gradeLevelId, section, adviserId, id){
    await prisma.class.upsert({
        create:{
            section: section,
            adviserId: Number(adviserId),
            gradeId: Number(gradeLevelId)
        },
        update:{
            section: section,
            adviserId: Number(adviserId),
            gradeId: Number(gradeLevelId)
        },
        where:{
            id: Number(id)
        }
    })
}

async function saveTeacher(teacher, id){
    await prisma.teacher.upsert({
        create:{
            email: teacher.email,
            password: teacher.password,
            name: teacher.name
        },
        update:{
            email: teacher.email,
            password: teacher.password,
            name: teacher.name
        },
        where:{
            id: Number(id)
        }
    })
}

async function saveSubject(subjectName, teacherId, classId, id){
    await prisma.subject.upsert({
        create:{
            name: subjectName,
            subjectTeacherId: Number(teacherId),
            classId: Number(classId)
        },
        update:{
            name: subjectName,
            subjectTeacherId: Number(teacherId),
            classId: Number(classId)
        },
        where:{
            id: Number(id)
        }
    })
}

async function saveType(name, percentage, id){
    await prisma.type.upsert({
        create:{
            name,
            percentage: parseFloat(percentage)
        },
        update:{
            name,
            percentage: parseFloat(percentage)
        },
        where:{
            id: Number(id)
        }
    })
}

async function saveActivity(activityName, totalItems, subjectId, typeId, quarter, id){
    var sy = await getCurrentSchoolYear()
    await prisma.activity.upsert({
        create:{
            activityName,
            totalItems: Number(totalItems),
            subjectId: Number(subjectId),
            typeId: Number(typeId),
            quarter: Number(quarter),
            schoolYearId: Number(sy.id)
        },
        update:{
            activityName,
            totalItems: Number(totalItems),
            subjectId: Number(subjectId),
            typeId: Number(typeId),
            quarter: Number(quarter),
            schoolYearId: Number(sy.id)
        },
        where:{
            id: Number(id)
        }
    })
}

async function saveManyScores(scores){
    for(var i = 0; i < scores.length; i++){
        await prisma.score.upsert({
            create:{
                score: Number(scores[i].score),
                activityId: Number(scores[i].activityId),
                studentId: Number(scores[i].studentId)
            },
            update:{
                score: Number(scores[i].score),
                activityId: Number(scores[i].activityId),
                studentId: Number(scores[i].studentId)
            },
            where:{
                id: await getScoreIdByActivityIdAndStudentId(scores[i].activityId, scores[i].studentId)
            }
        })
    }
}

async function getScoreIdByActivityIdAndStudentId(activityId, studentId){
    var score = await prisma.score.findFirst({
        where:{
            AND:[
                {activityId: Number(activityId)},
                {studentId: Number(studentId)}
            ]
        }
    })

    return score == null ? 0 : score.id
}

async function getTeachers(){
    return await prisma.teacher.findMany({
        include:{
            subjects:{
                include:{
                    activities:{
                        include:{
                            type: true
                        }
                    }
                }
            },
            class:{
                include:{
                    students:{
                        include:{
                            scores: true
                        },
                        orderBy:{
                            lastName: 'asc'
                        }
                    },
                    subjects:{
                        include:{
                            subjectTeacher: true
                        }
                    },
                    grade: true
                }
            }
        }
    })
}

async function getClasses(){
    return await prisma.class.findMany({
        include:{
            adviser: true,
            students: {
                orderBy:{
                    lastName: 'asc'
                }
            },
            subjects:{
                include:{
                    subjectTeacher: true
                }
            }
        }
    })
}

async function getClassByIdAndSyId(id, syId){
    var sy = syId == 0 ? await getCurrentSchoolYear() : await getSchoolYear(syId)
    var selectedClass = await prisma.class.findUnique({
        where:{
            id: Number(id)
        },
        include:{
            adviser: true,
            students: {
                // where:{
                //     schoolRecords:{
                //         some:{
                //             schoolYearId: Number(syId)
                //         }
                //     }
                // },
                orderBy:{
                    lastName: 'asc'
                },
                include:{
                    schoolRecords: true
                }
            },
            subjects:{
                include:{
                    subjectTeacher: true
                }
            },
            grade: true
        }
    })
    var filteredStudents = []
    for(var i = 0; i < selectedClass.students.length; i++){
        var student = selectedClass.students[i]
        for(var j = 0; j < student.schoolRecords.length; j++){
            var schoolRecord = student.schoolRecords[j]
            if(schoolRecord.schoolYearId == sy.id){
                filteredStudents.push(student)
            }
        }
    }
    selectedClass.students = filteredStudents
    return selectedClass
}

async function getClassByTeacherIdAndSyId(teacherId, syId){
    var sy = syId == "0" ? await getCurrentSchoolYear() : await getSchoolYear(syId)
    var currentClass = await prisma.class.findFirst({
        where:{
            adviserId: Number(teacherId)
        },
        include:{
            students:{
                // where:{
                //     schoolRecords:{
                //         some: {
                //             schoolYearId: Number(syId)
                //         }
                //     }
                // },
                include:{
                    scores: true,
                    schoolRecords: true
                },
                orderBy:{
                    lastName: 'asc'
                }
            },
            subjects: {
                include:{
                    subjectTeacher: true
                }
            },
            grade: true
        }
    })
    var filteredStudents = []
    if(currentClass){
        for(var i = 0; i < currentClass.students.length; i++){
            var student = currentClass.students[i]
            for(var j = 0; j < student.schoolRecords.length; j++){
                var schoolRecord = student.schoolRecords[j]
                if(schoolRecord.schoolYearId == sy.id){
                    filteredStudents.push(student)
                }
            }
        }
        currentClass.students = filteredStudents
    }
    return currentClass
}

async function getClassesForSubjectTeacherByTeacherId(teacherId){
    var sy = await getCurrentSchoolYear()
    var relatedClasses = await prisma.class.findMany({
        where:{
            subjects:{
                some:{
                    subjectTeacherId: Number(teacherId)
                }
            }
        },
        include:{
            subjects:{
                where:{
                    subjectTeacherId: Number(teacherId)
                },
                include:{
                    activities:{
                        include:{
                            type: true
                        }
                    }
                }
            },
            students:{
                // where:{
                //     schoolRecords:{
                //         some:{
                //             schoolYearId: Number(sy.id)
                //         }
                //     }
                // },
                include:{
                    scores: true,
                    schoolRecords: true
                },
                orderBy:{
                    lastName: 'asc'
                }
            },
            grade: true
        }
    })
    for(var i = 0; i < relatedClasses.length; i++){
        var filteredStudents = []

        var selectedClass = relatedClasses[i]
        for(var j = 0; j < selectedClass.students.length; j++){
            var student = selectedClass.students[j]
            for(var k = 0; k < student.schoolRecords.length; k++){
                var schoolRecord = student.schoolRecords[k]
                if(schoolRecord.schoolYearId == sy.id){
                    filteredStudents.push(student)
                }
            }
        }
        for(var j = 0; j < selectedClass.subjects.length; j++){
            var filteredActivities = []
            var subject = selectedClass.subjects[j]
            for(var k = 0; k < subject.activities.length; k++){
                if(subject.activities[k].schoolYearId == Number(sy.id)){
                    filteredActivities.push(subject.activities[k])
                }
            }
            subject.activities = filteredActivities
        }
        selectedClass.students = filteredStudents
    }

    for(var i = 0; i < relatedClasses.length; i++){
        var currentClass = relatedClasses[i]
        for(var j = 0; j < currentClass.subjects.length; j++){
            var currentSubject = currentClass.subjects[j]
            var quarters = {
                quarter1: [],
                quarter2: [],
                quarter3: [],
                quarter4: []
            }
            for(var k = 0; k < currentSubject.activities.length; k++){
                var currentActivity = currentSubject.activities[k]
                quarters['quarter' + currentActivity.quarter].push(currentActivity)
            }
            currentSubject.activities = quarters
        }
    }
    return relatedClasses
}

async function getTypes(){
    return await prisma.type.findMany({

    })
}

async function getScoresByActivityId(activityId){
    return await prisma.score.findMany({
        where:{
            activityId: Number(activityId)
        }
    })
}

async function getTotalItemsByActivityId(activityId){
    var activity = await prisma.activity.findUnique({
        where:{
            id: Number(activityId)
        }
    })

    return activity.totalItems
}

async function getTeacherByTeacherId(teacherId){
    return await prisma.teacher.findUnique({
        where:{
            id: Number(teacherId)
        }
    })
}

async function getSubjectBySubjectId(subjectId){
    return await prisma.subject.findUnique({
        where:{
            id: Number(subjectId)
        },
        include:{
            activities: true
        }
    })
}

async function getAllGradesByClass(advisory){
    if(advisory == null){
        return null
    }
    
    var subjects = advisory.subjects
    var students = advisory.students

    var studentsGrades = {}
    studentsGrades.subjects = subjects

    for(var i = 1; i <= 4; i++){
        studentsGrades['quarter' + i] = {}
        for(var j = 0; j < students.length; j++){
            var student = students[j]
            studentsGrades['quarter' + i][student.id] = {}
            var grades = 0
            for(var k = 0; k < subjects.length; k++){
                var subject = subjects[k]
                var grade = await getQuarterGradeByStudentIdAndSubjectId(i, student.id, subject.id)
                studentsGrades['quarter' + i][student.id][subject.id] = grade.toFixed(2)
                grades += parseFloat(grade.toFixed(2))
            }
            studentsGrades['quarter' + i][student.id].finalGrade = (grades / subjects.length).toFixed(2)
        }
    }
    return studentsGrades
}

async function getStudentGradeByStudentId(studentId){
    if(isNaN(parseInt(studentId))){
        redirect('/dashboard')
    }
    var finalStudentId = parseInt(studentId)
    var subjects = await getSubjectsByStudentId(finalStudentId)
    var data = {}
    var subs = []
    var totalFinalGrade = 0
    for(var i = 0; i < subjects.length; i++){
        var subject = subjects[i]
        var totalGrade = 0
        data.subject = {}
        for(var j = 1; j <= 4; j++){
            var grade = Math.round(await getQuarterGradeByStudentIdAndSubjectId(j, finalStudentId, subject.id))
            totalGrade += grade
            subject['quarter' + j] = grade
        }
        var subjectAverage = totalGrade <= 0 ? 0 : Math.round(totalGrade / 4)
        totalFinalGrade += subjectAverage
        subject.final = subjectAverage
        subs.push(subject)
    }
    var totalAverage = totalFinalGrade <= 0 ? 0 : Math.round(totalFinalGrade / subjects.length)
    data.subjects = subs
    data.final = totalAverage
    return data
}

async function getQuarterGradeByStudentIdAndSubjectId(quarter, studentId, subjectId){
    var types = await getTypes()
    var quarterGrade = 0
    //A = 20%
    //E = 50%
    //Q = 30%

    //A = 18% or 0.18
    //E = 45% or 0.45
    //Q = 27% or 0.27
    //qurterGrde = (0.18 + 0.45 + 0.27) * 100
    for(var i = 0; i < types.length; i++){
        var type = types[i]
        var percentage = type.percentage * 0.01
        var typeGrade = await getActivityComputationPerTypeBySubjectIdAndStudentId(type.id, quarter, studentId, subjectId)
        if(typeGrade != null){
            quarterGrade += typeGrade * percentage
        }else{
            quarterGrade += 0
        }
    }
    return quarterGrade * 100
}

async function getActivityComputationPerTypeBySubjectIdAndStudentId(typeId, quarter, studentId, subjectId){
    var activities = await prisma.activity.findMany({
        where:{
            AND:[
                {quarter: Number(quarter)},
                {subjectId: Number(subjectId)},
                {typeId: Number(typeId)}
            ]
        },
        include:{
            scores:{
                where:{
                    studentId: Number(studentId)
                }
            }
        }
    })
    if(activities.length == 0){
        return null
    }
    var totalItems = 0
    var score = 0
    for(var i = 0; i < activities.length; i++){
        totalItems += activities[i].totalItems
        var activityScore = 0
        for(var j = 0; j < activities[i].scores.length; j++){
            activityScore += Number(activities[i].scores[j].score)
        }
        score += activityScore
    }
    var grade = score / totalItems
    return grade
}

async function getTypes(){
    return await prisma.type.findMany({})
}

async function getPredictionGradesOfStudentsByClassIdAndSyId(classId, syId){
    // var selectedClass = await getClassByIdAndSyId(classId, syId)
    var selectedClass = await getAdvisoryByClassIdAndSchoolYearId(classId, syId)
    var grades = await getAllGradesByClass(selectedClass)
    for(var i = 0; i < selectedClass.students.length; i++){
        var countGrades = 0
        selectedClass.students[i]['grades'] = {}
        for(var j = 1; j <= 4; j++){
            var currentGrade = Number(grades['quarter' + j][selectedClass.students[i].id].finalGrade)
            countGrades += currentGrade
            selectedClass.students[i]['grades']['quarter' + j] = {
                ...grades['quarter' + j][selectedClass.students[i].id],
                remarks: await predictSingleGrade(Math.ceil(currentGrade))
            }
        }
        selectedClass.students[i]['grades'].final = {}
        selectedClass.students[i]['grades'].final.finalGrade = (countGrades / 4).toFixed(2)
        selectedClass.students[i]['grades'].final.remarks = await predictSingleGrade(Math.ceil((countGrades /4).toFixed(2)))
    }
    return selectedClass
}

async function predictSingleGrade(grade){
    const features = ['grade']
    //pass = result
    //'grade' = data
    const dt = new DecisionTree(await getTrainingData(passingGrade), 'pass', features)
    const student = {grade: grade}
    const prediction = dt.predict(student)
    return prediction
}
//0 - 100
//75 passingGrade
// < 75 - false
// >= 75 - true
// [{grade: 1, pass: false}, {grade: 2, pass: false}, ..., {grade: 75, pass: true}, ...]
// {grade: 75} = false
// 

async function getTrainingData(passingGrade){
    const trainingData = Array.from({ length: 100 }, (_, index) => {
        const grade = index + 1
        const pass = grade >= Number(passingGrade)
        return { grade: grade, pass }
    })
    return trainingData
}

async function examLimitReached(subjectId, typeId, quarter){
    var type = await prisma.type.findFirst({
        where:{
            id: Number(typeId)
        }
    })
    if(type.name.toLowerCase() != 'exam'){
        return false
    }else{
        var activity = await prisma.activity.findFirst({
            where:{
                AND:[
                    {subjectId: Number(subjectId)},
                    {typeId: Number(typeId)},
                    {quarter: Number(quarter)}
                ]
            }
        })
        return activity != null
    }
}

async function getSubjectsByStudentId(studentId){
    var data = await prisma.student.findFirst({
        where:{
            id: studentId
        },
        include:{
            class:{
                include:{
                    subjects:{
                        orderBy: {
                            name: 'asc'
                        }
                    }
                }
            }
        }
    })
    return data.class.subjects
}

async function getCurrentSchoolYear(){
    var data = await prisma.schoolYear.findFirst({
        where:{
            isCurrent: true
        }
    })
    return data
}

async function getSchoolYear(syId){
    var data = await prisma.schoolYear.findFirst({
        where:{
            id: Number(syId)
        }
    })
    return data
}

async function getSchoolYears(){
    var data = await prisma.schoolYear.findMany({})
    return data
}

async function changeCurrentSchoolYearById(syId){
    await prisma.schoolYear.updateMany({
        where:{
            NOT:{
                id: 0
            }
        },
        data:{
            isCurrent: false
        }
    })
    await prisma.schoolYear.update({
        where:{
            id: Number(syId)
        },
        data:{
            isCurrent: true
        }
    })
}

async function getGradeLevels(){
    var gradeLevels = await prisma.grade.findMany({})
    if(gradeLevels.length > 0 ){
        return gradeLevels
    }
    await prisma.grade.createMany({
        data: [
            { gradeLevel: "1" },
            { gradeLevel: "2" },
            { gradeLevel: "3" },
            { gradeLevel: "4" },
            { gradeLevel: "5" },
            { gradeLevel: "6" }
        ]
    })
    return getGradeLevels()
}

function generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length/2))
      .toString('hex')
      .slice(0,length)
}

function checkAdmin (req, res, next){
    if(req.body.email == 'admin' && req.body.password == 'admin')
        return res.redirect('/admin')
    next()
}

async function onlyAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('/')
}

function onlyNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/dashboard')
    }

    next()
}

app.listen(8080, 'localhost')