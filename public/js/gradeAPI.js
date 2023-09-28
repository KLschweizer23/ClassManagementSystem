function showGrades(perGradeData, studentData){
    var gradeTable = convertGradeDataToTable(perGradeData)
    var modal = `
    <div class="modal fade" id="studentGradeModal" tabindex="-1" aria-labelledby="studentGradeModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="studentGradeModalLabel">${ studentData.lastName + ", " + studentData.firstName + " - Grade Records" }</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${gradeTable}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
    `
    var modalElement = document.createElement('div')
    modalElement.innerHTML = modal
    document.body.appendChild(modalElement)

    $('#studentGradeModal').modal('show')

    $('#studentGradeModal').on('hidden.bs.modal', () => {
        $('#studentGradeModal').remove()
    })
}

function convertGradeDataToTable(perGradeData){
    var wholeTableHtml = ''
    for(var i = 1; i <= 6; i++){
        var currentGrade = perGradeData['grade' + i]
        if(!currentGrade){
            wholeTableHtml += `
                <div class="w-100 m-0 p-0 text-center">
                    <h4>Grade ${ i } - X </h4>
                </div>
            `
            continue
        }
        wholeTableHtml += `
            <div class="w-100 m-0 p-0 text-center">
                <h4>${ "Grade " + i + " - " + currentGrade.class.class.section }</h4>
            </div>
            
            <div class="table-responsive-xl">
            <table class="table table-hover">
                <thead>
                    <tr>
        `
        for(var j = 0; j < currentGrade.grades.length; j++){
            wholeTableHtml += `
                        <th scope="col">${ currentGrade.grades[j].subject }<br>${ currentGrade.grades[j].subjectTeacher.name }</th>
            `
        }
        wholeTableHtml += `
                        <th scope="col">Final Grade</th>
        `
        wholeTableHtml += `
                    </tr>
                </thead>
                <tbody>
                    <tr>
        `
        var grade = 0
        console.log(currentGrade.grades)
        for(var j = 0; j < currentGrade.grades.length; j++){
            grade += currentGrade.grades[j].grade
            wholeTableHtml += `
                        <td>${ currentGrade.grades[j].grade }</td>
            `
        }
        wholeTableHtml += `
                        <td>${ (grade / currentGrade.grades.length) }%</td>
                    </tr>
                </tbody>
            </table>
            </div>
        `
    }
    return wholeTableHtml
}