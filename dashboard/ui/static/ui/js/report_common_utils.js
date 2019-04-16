const replaceModalContentEntirely = () => {

    var modalContentHTML = `
            <form id="sendMailForm" onsubmit="event.preventDefault(); sendMailHandler()" action="#" data-ajax="false">
            
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">Email Report</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            
            <div class="modal-body"> 
                <div class="form-group">
                <label for="recipient-mail" class="col-form-label">Recipient:</label>
                <input type="email" class="form-control" onchange="try{setCustomValidity('')}catch(e){}" oninvalid="setCustomValidity('Must be Quantiphi Email-ID !!!')" name="recipient-mail" required >
                </div>
            </div>

            <div class="modal-footer">
                <!-- <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button> -->
                <button type="submit" class="btn btn-primary">Send E-mail</button>
            </div>

        </form>`;

    var modalContent = document.querySelector("#myModal .modal-content");
    modalContent.innerHTML = modalContentHTML;

}

const replaceModalContentWithInProgress = () => {
    //  1. replace content of modal-body with inprogress HTML
    var inprogressHTML = `<center><i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size:150px"></i> <br><br> <h3> Sending Mail... </h3> </center>`;
    
    var modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = inprogressHTML;

    //  2. replace content of modal-footer with empty
    var modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = '';

}

const replaceModalContentWithSuccess = () => {
    //  1. replace content of modal-body with success HTML
    var successHTML = `<center><i class="fa fa-check-circle" style="font-size:150px;color:green"></i> <br><br> <h3>Mailed Successfully!</h3> </center>`;

    var modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = successHTML;

    //  2. replace content of modal-footer with empty
    var successFooterHTML = `<button class="btn btn-success" onclick="replaceModalContentEntirely()">Send Another</button>`;
    var modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = successFooterHTML;
}

const replaceModalContentWithFailure = () => {
    //  1. replace content of modal-body with failure HTML
    var failureHTML = `<center><i class="fa fa-times-circle" style="font-size:150px;color:red"></i>  <br><br> <h3>Failure in mailing!<h3> <center>`;
    
    var modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = failureHTML;
    
    //  2. replace content of modal-footer with empty
    var failureFooterHTML = `<button class="btn btn-danger" onclick="replaceModalContentEntirely()">Try Again</button>`;
    
    var modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = failureFooterHTML;
}

const postDataTableExport = (receiverMail, dataTableExport, filename, reportType, dates) => {

    var POST_ENDPOINT = new URL(window.location.protocol + "//" + window.location.host + '/ui/send_mail');
    
    var dataToPost = {
                        'receiver_email': receiverMail, 
                        'datatable_export': JSON.stringify(dataTableExport),
                        'filename': filename,
                        'report_type' : reportType,
                        'dates' : dates
                      };
    
    return $.post(POST_ENDPOINT, dataToPost);
}