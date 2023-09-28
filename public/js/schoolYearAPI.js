async function showModal(elementId, isAdmin){
    $.get('/api/get-school-years').done(async (response) => {
        designModal(elementId, await response.sys, isAdmin)
    })
}

function changeEndYear(){
    document.getElementById('endYear').value = getAfterYear()
}

function getAfterYear(){
    var startYear = document.getElementById('startYear')
    return Number(startYear.value) + 1
}

function addSchoolYear(){
    var schoolYear = document.getElementById('startYear').value + "-" + document.getElementById('endYear').value
    $.post('/save-school-year', { schoolYear }).done(() => {
        window.location.reload()
    })
}

function reloadBySy(elementId){
    var textLink = document.getElementById(elementId)
    var id = textLink.dataset.id
    window.location.href = '/dashboard/' + id
}

async function designModal(elementId, schoolYears, isAdmin){
    var schoolYearTable = await convertToTableSY(elementId, schoolYears, isAdmin)
    var adminFeatures = `
        <br>
        <h5>Add New School Year</h5>

        <label for="startYear">Start Year:</label>
        <input type="number" id="startYear" min="2020" max="2099" onchange="changeEndYear()">

        <label for="endYear">End Year:</label>
        <input type="number" id="endYear" min="2020" max="2099" disabled>
        <br>
        <button class="btn btn-success" onclick="addSchoolYear()">Add School Year</button>
    `

    var modal = `
    <div class="modal fade" id="syModal" tabindex="-1" aria-labelledby="syModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="syModalLabel">List of School Years</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${schoolYearTable}
                    ${isAdmin ? adminFeatures : "" }
                </div>
            </div>
        </div>
    </div>
    `

    var modalElement = document.createElement('div')
    modalElement.innerHTML = modal
    document.body.appendChild(modalElement)

    $('#syModal').modal('show')

    $('#syModal').on('hidden.bs.modal', () => {
        $('#syModal').remove()
    })
}

function isSelected(sy){
    var currentUrl = window.location.href
    var parts = currentUrl.split('/')
    var lastPart = parts[parts.length - 1]
    return sy.id == Number(lastPart)
}

async function convertToTableSY(elementId, schoolYears, isAdmin){
    var tableHTML = `
        <table class = "table table-hover">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">School Year</th>
                    <th scope="col">Action</th>
                </tr>
            </thead>
            <tbody>
    `

    for(var i = 0; i < schoolYears.length; i++){
        var actionData = ""
        if(schoolYears[i].isCurrent && isAdmin){
            actionData += `Currently Selected`
        }else{
            if(!isAdmin && isSelected(schoolYears[i])){
                actionData += `Currently Selected`
            }else{
                actionData += `
                    <button class="btn btn-success" onclick="${ "selectFunction('" + elementId + "', '" + schoolYears[i].id + "', " + isAdmin + ")" }">${ isAdmin ? "Set School Year" : "Select" }</button>
                `
            }
            if(isAdmin){
                actionData += `
                    <button class="btn btn-danger" onclick="deleteSchoolYear('${schoolYears[i].id}')">Remove</button>
                `
            }
        }
        tableHTML += `
                <tr>
                    <td>${ i + 1 }</td>
                    <td id="sy_${ schoolYears[i].id }">${ schoolYears[i].title }</td>
                    <td class="text-center">${ actionData }</td>
                </tr>
        `
    }

    tableHTML += `
            </tbody>
        </table>
    `

    return tableHTML
}

async function selectFunction(elementId, schoolYearId, isAdmin){
    if(!isAdmin){
        selectFunctionProcess(elementId, schoolYearId, isAdmin)
    }
    showYesCancelAlert("Are you sure you want to change the current school year? All assigned students will be unassigned to their assigned classroom. You cannot undo once you click \"Yes\".", async () => {
        selectFunctionProcess(elementId, schoolYearId, isAdmin)
    })
}

async function selectFunctionProcess(elementId, schoolYearId, isAdmin){
    var element = document.getElementById(elementId)
    var sy = document.getElementById('sy_' + schoolYearId).innerText
    element.innerText = sy
    element.dataset.id = schoolYearId
    $('#syModal').modal('hide')

    if(isAdmin){
        $.post('/change-current-year', { schoolYearId }).done(() => {
            window.location.reload()
        })
    }else{
        reloadBySy(elementId)
    }
}

async function deleteSchoolYear(syId){
    $.post('/delete-school-year/' + syId).done(() => {
        window.location.reload()
    })
}