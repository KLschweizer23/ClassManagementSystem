async function showStudents(inputId){
    displayStudentModal(inputId)
}

function displayStudentModal(inputId){
    
    var modal = `
    <div class="modal fade" id="studentModal" tabindex="-1" aria-labelledby="studentModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="studentModalLabel">Select a Teacher</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times</span>
                    </button>
                </div>
                <div class="modal-body">
                    <label for="studentSearch">Student:</label>
                    <input type="text" class="form-control" id="studentSearch" name="studentSearch" oninput="searchStudent('${ inputId }')">
                    
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th scope="col">ID Number</th>
                                <th scope="col">Student Name</th>
                                <th scope="col">Sex</th>
                            </tr>
                        </thead>
                        <tbody id="tbodySearchStudent">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `
  
    // Create a modal element and append the modal HTML
    var modalElement = document.createElement('div')
    modalElement.innerHTML = modal
    document.body.appendChild(modalElement)

    // Show the modal
    $('#studentModal').modal('show')

    // Remove the modal from the DOM when it is closed
    $('#studentModal').on('hidden.bs.modal', () => {
        $('#studentModal').remove()
    })

    searchStudent(inputId)
}

async function searchStudent(inputId){
    var name = $('#studentSearch').val()
    $.post('/search-unassigned-student', { name }).done(async (response) => {
        populateStudentModalTable(await response.dataResult, inputId)
    })
}

function populateStudentModalTable(data, inputId){
    var tbodyStudentModal = document.getElementById('tbodySearchStudent')
    tbodyStudentModal.innerHTML = ''
    for(var i = 0; i < data.length; i++){
        var row = `
            <tr onclick="applyStudent(${ data[i].id }, '${ inputId }')" style="cursor: pointer">
                <td>${ data[i].id }</td>
                <td id="studentName_${ data[i].id }">${ data[i].lastName + ", " + data[i].firstName }</td>
                <td>${ data[i].sex }</td>
            </tr>
        `
        tbodyStudentModal.innerHTML += row
    }
}

async function applyStudent(id, inputId){
    var input = document.getElementById(inputId)
    var data = document.getElementById('studentName_' + id)

    input.value = id + "-" + data.innerText

    $('#studentModal').modal('hide')
}