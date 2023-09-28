function showErrorMessageAlert(message){
    var modal = `
    <div class="modal fade" id="errorMsgModal" tabindex="-1" aria-labelledby="errorMsgModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="errorMsgModalLabel"><i class="fa-solid fa-xmark fa-xl mr-1" style="color: #f01919;"></i> - Error Message</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${message}
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

    $('#errorMsgModal').modal('show')

    $('#errorMsgModal').on('hidden.bs.modal', () => {
        $('#errorMsgModal').remove()
    })
}

function showYesCancelAlert(message, yesFunction){
    var modal = `
    <div class="modal fade" id="yesCancelModal" tabindex="-1" aria-labelledby="yesCancelModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="yesCancelModalLabel"><i class="fa-solid fa-hand mr-1" style="color: #154dac;"></i> - Are you sure?</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger" data-dismiss="modal" id="yesButton">Yes</button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                </div>
            </div>
        </div>
    </div>
    `
    var modalElement = document.createElement('div')
    modalElement.innerHTML = modal
    document.body.appendChild(modalElement)

    var yesButton = document.getElementById('yesButton')
    yesButton.addEventListener('click', async () => {
        yesFunction()
    })

    $('#yesCancelModal').modal('show')

    $('#yesCancelModal').on('hidden.bs.modal', () => {
        $('#yesCancelModal').remove()
    })
}