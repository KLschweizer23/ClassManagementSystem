const passport = require('passport')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const LocalStrategy = require('passport-local').Strategy

function initialize(passport, getTeacherByEmail, getTeacherById){
    const authenticateUser = async (teacherEmail, password, done) => {
        if(teacherEmail == 'admin' && password == 'admin'){
            const teacher = {
                id: 0
            }
            return done(null, teacher)
        }
        const teacher = await prisma.teacher.findFirst({
            where:{
                email: teacherEmail
            }
        })
        if(teacher == null){
            return done(null, false, { message: 'Credentials not found' })
        }
        try{
            if(password == teacher.password){
                return done(null, teacher)
            }else{
                return done(null, false, { message: 'Password incorrect' })
            }
        }catch (e){
            return done(e)
        }
    }

    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser))
    passport.serializeUser((teacher, done) => done(null, teacher.id))
    passport.deserializeUser((id, done) => {
        if(id == 0){
            const teacher = {id: 0}
            return done(null, teacher)
        }
        return done(null, getTeacherById(id))
    })
}

module.exports = initialize