const replaceModalContentEntirely = () => {

    const MODAL_CONTENT_HTML = `
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

    let modalContent = document.querySelector("#myModal .modal-content");
    modalContent.innerHTML = MODAL_CONTENT_HTML;

}

const replaceModalContentWithInProgress = () => {
    //  1. replace content of modal-body with inprogress HTML
    const INPROGRESS_HTML = `<center><i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size:150px"></i> <br><br> <h3> Sending Mail... </h3> </center>`;
    
    let modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = INPROGRESS_HTML;

    //  2. replace content of modal-footer with empty
    let modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = '';

}

const replaceModalContentWithSuccess = () => {
    //  1. replace content of modal-body with success HTML
    const SUCCESS_HTML = `<center><i class="fa fa-check-circle" style="font-size:150px;color:green"></i> <br><br> <h3>Mailed Successfully!</h3> </center>`;

    let modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = SUCCESS_HTML;

    //  2. replace content of modal-footer with empty
    const SUCCESS_FOOTER_HTML = `<button class="btn btn-success" onclick="replaceModalContentEntirely()">Send Another</button>`;
    let modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = SUCCESS_FOOTER_HTML;
}

const replaceModalContentWithFailure = () => {
    //  1. replace content of modal-body with failure HTML
    const FAILURE_HTML = `<center><i class="fa fa-times-circle" style="font-size:150px;color:red"></i>  <br><br> <h3>Failure in mailing!<h3> <center>`;
    
    let modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = FAILURE_HTML;
    
    //  2. replace content of modal-footer with empty
    const FAILURE_FOOTER_HTML = `<button class="btn btn-danger" onclick="replaceModalContentEntirely()">Try Again</button>`;
    
    let modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = FAILURE_FOOTER_HTML;
}

const postDataTableExport = (receiverMail, dataTableExport, filename, reportType, dates) => {

    let POST_ENDPOINT = new URL(window.location.protocol + "//" + window.location.host + '/ui/send_mail');
    
    let dataToPost = {
                        'receiver_email': receiverMail, 
                        'datatable_export': JSON.stringify(dataTableExport),
                        'filename': filename,
                        'report_type' : reportType,
                        'dates' : dates
                      };
    
    return $.post(POST_ENDPOINT, dataToPost);
}

const prepareDataTableExport = (type) => {
    
    //  0. retrieve data from form
    let sendMailFormID = "sendMailForm";
    let sendMailForm = document.forms[sendMailFormID];
    let receiverMail = sendMailForm.elements['recipient-mail'].value;

    //  1. replace modal content with inprogress
    replaceModalContentWithInProgress();

    let dataTableExport = globalTable.buttons.exportData();

    let reportType;
    let date;
    let filename;

    if (type == 'daily') {

        reportType = 'Daily';
        date = new URL(document.URL).searchParams.get('date');
        filename = date + '_daily_report.csv';
    }
    else if (type == 'weekly') {

        let startDate = new URL(document.URL).searchParams.get('start_date');
        let endDate = new URL(document.URL).searchParams.get('end_date');

        reportType = 'Weekly';
        date = startDate + " to " + endDate;
        filename = startDate + '_' + endDate + '_weekly_report.csv';
    }

    postDataTableExport(receiverMail, dataTableExport, filename, reportType, date)
        .done((response, status) => {
            replaceModalContentWithSuccess();
        })
        .fail((response, status) => {
            replaceModalContentWithFailure();
        });
}