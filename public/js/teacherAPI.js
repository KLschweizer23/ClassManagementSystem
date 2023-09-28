/*
    This API is to generate and show a list of teachers through a modal
    First parameter is the id of label or input to where the info of teacher will display
    Second parameter is to determine if to return teachers with no advisory or not
*/

// Function to get teachers by making a GET request
async function getTeachers(labelId, noAdvisoryOnly) {
    $.get('/api/get-teachers').done(async (response) => {
        // Call displayModal function with the response teachers data
        displayModal(labelId, await response.teachers, noAdvisoryOnly)
    })
}

// Function to display the modal dialog with the teacher table
async function displayModal(labelId, teachers, noAdvisoryOnly) {
    // Convert teachers data to an HTML table
    var teacherTable = await convertToTable(labelId, teachers, noAdvisoryOnly)

    // Create the modal HTML markup
    var modal = `
    <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Select a Teacher</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${teacherTable}
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
    $('#exampleModal').modal('show')

    // Remove the modal from the DOM when it is closed
    $('#exampleModal').on('hidden.bs.modal', () => {
        $('#exampleModal').remove()
    })
}

// Function to convert teachers data into an HTML table
async function convertToTable(labelId, teachers, noAdvisoryOnly) {
    var tableHtml = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Advisory</th>
                </tr>
            </thead>
            <tbody>
    `

    // Loop through the teachers and generate table rows
    var counter = 0;
    for (var i = 0; i < teachers.length; i++) {
        // Skip teachers with advisory if noAdvisoryOnly is true
        if (!noAdvisoryOnly && teachers[i].class != null) {
            continue
        }

        // Append a table row for each teacher
        tableHtml += `
            <tr style="cursor:pointer" onclick="applyTeacher(${teachers[i].id}, '${labelId}')">
                <th scope="row">${++counter}</th>
                <td id="teacherName${teachers[i].id}">${teachers[i].name}</td>
                <td>${teachers[i].class == null ? "None" : "G" + teachers[i].class.grade.gradeLevel + " - " + teachers[i].class.section}</td>
            </tr>
        `
    }

    tableHtml += `
            </tbody>
        </table>
    `

    // Return the generated table HTML
    return tableHtml
}

// Function to apply the selected teacher
async function applyTeacher(id, labelId) {
    var label = document.getElementById(labelId)
    var element = document.getElementById('teacherName' + id)
  
    // Set the selected teacher in the label or input element
    if (label.tagName.toLowerCase() == 'label') {
        label.innerText = id + "-" + element.innerText
    } else if (label.tagName.toLowerCase() == 'input') {
        label.value = id + "-" + element.innerText
    } else {
        // Handle other cases if needed
    }

    // Hide the modal
    $('#exampleModal').modal('hide')
}