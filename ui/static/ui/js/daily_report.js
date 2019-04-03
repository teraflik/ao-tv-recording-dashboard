
function insertInProgressHTML(querySelector, ms) {
    
    $(querySelector).html(`<center><i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size:150px"></i> <br><br> <h3> Getting Daily Report... </h3> </center>`);
    
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve("done!"), ms);
    });
}

function setColumns(columnNames) {

    rowHtml = '';

    $.each(columnNames, function(i, columnName) {
        columnHtml = '<th scope="col">' + columnName + '</th>';
        rowHtml += columnHtml;
    });

    $('tr#header-row').html(rowHtml);
    $('tr#footer-row').html(rowHtml);
}


function createArrayValueToIndexMap(array) {
    var map = {};
    for (var index = 0; index < array.length; index++) {
        var value = array[index];
        map[value] = index;
    }
    return map;
}

var globalTable;

function replaceModalContentEntirely() {

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

function replaceModalContentWithInProgress() {
    //  1. replace content of modal-body with inprogress HTML
    var inprogressHTML = `<center><i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size:150px"></i> <br><br> <h3> Sending Mail... </h3> </center>`;
    
    var modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = inprogressHTML;

    //  2. replace content of modal-footer with empty
    var modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = '';

}

function replaceModalContentWithSuccess() {
    //  1. replace content of modal-body with success HTML
    var successHTML = `<center><i class="fa fa-check-circle" style="font-size:150px;color:green"></i> <br><br> <h3>Mailed Successfully!</h3> </center>`;

    var modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = successHTML;

    //  2. replace content of modal-footer with empty
    var successFooterHTML = `<button class="btn btn-success" onclick="replaceModalContentEntirely()">Send Another</button>`;
    var modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = successFooterHTML;
}

function replaceModalContentWithFailure() {
    //  1. replace content of modal-body with failure HTML
    var failureHTML = `<center><i class="fa fa-times-circle" style="font-size:150px;color:red"></i>  <br><br> <h3>Failure in mailing!<h3> <center>`;
    
    var modalBody = document.querySelector("#myModal .modal-body");
    modalBody.innerHTML = failureHTML;
    
    //  2. replace content of modal-footer with empty
    var failureFooterHTML = `<button class="btn btn-danger" onclick="replaceModalContentEntirely()">Try Again</button>`;
    
    var modalFooter = document.querySelector("#myModal .modal-footer");
    modalFooter.innerHTML = failureFooterHTML;
}

function sendMailHandler() {

    var date = new URL(document.URL).searchParams.get('date');

    //  0. retrieve data from form
    var sendMailFormID = "sendMailForm";
    var sendMailForm = document.forms[sendMailFormID];
    var recipientMail = sendMailForm.elements['recipient-mail'].value;

    console.log("sendMailForm is ... " + sendMailForm);
    console.log("recipientMail is ... " + recipientMail);
    
    //  1. replace modal content with inprogress
    replaceModalContentWithInProgress();

    var endpoint = new URL(window.location.protocol + "//" + window.location.host + '/ui/send_mail');

    var dataTableExport = globalTable.buttons.exportData();

    console.log("exportedData is ...");
    console.log(dataTableExport);

    var dataToSend = {
    'recipient_mail': recipientMail, 
    'datatable_export': JSON.stringify(dataTableExport),
    'filename': date + '_daily_report.csv',
    'report_type' : 'Daily',
    'dates' : date
    };


    $.post(endpoint, dataToSend)
    .done(function(response, status) {
        replaceModalContentWithSuccess();
    })
    .fail(function(response, status) {
        replaceModalContentWithFailure();
    });
}

var globalData;

$(document).ready(function(){

    // // 0.0  Attach mail handler 
    $('body').on('submit','#sendMailForm', sendMailHandler);

    //  1. get date from URL params
    var date = new URL(document.URL).searchParams.get('date');

    //  2. insert inProgress HTML to page and wait for 200ms (for the inProgressHTML to render properly)
    insertInProgressHTML("#example", 2500).then(function(response) {
        
        //  3. Get Daily Report data.
        var data = generateDailyReport(date)['filteredFormattedReportData'];

        globalData = data;

        if (data.length == 0) {
            $('#example').html("<center><h4> No blank entries. </h4><center>");
        }
        else {
            // $('#example').html("<center><h4> There are blank entries. </h4><center>");

            $('#example').html(`<thead><tr id="header-row"></tr></thead><tfoot><tr id="footer-row"></tr></tfoot>`);          

            var columnNames = Object.keys(data[0]);
            console.log("columnNames are ...");
            console.log(columnNames);

            
            setColumns(columnNames);

            // get column names in the dataTable required format
            var columns = [];
            for (i = 0; i < columnNames.length; i++) {
                columns.push({"data": columnNames[i]});
            }

            //  define filename of the downloaded CSV.
            var csvFileName = date + '_daily_report';

            var table =  $('#example').DataTable({

                //  1. buttons configuration
                dom: 'Bfrtip',
                buttons: [
                        {
                            extend: 'csv',
                            filename: csvFileName,
                            text: 'Download CSV',
                        },
                        {
                            text: 'Mail CSV',
                            action: function ( e, dt, node, config ) {
                                $("#myModal").modal("show");
                            }
                        },
                    ],
                
                //  2. providing data
                data: data,

                //  3. providing column names in desired format
                "columns": columns,

                //  4. dropdown selection for channel_name
                initComplete: function () {
                    this.api().columns([0]).every( function () {
                        var column = this;
                        var select = $('<select><option value=""></option></select>')
                            .appendTo( $(column.footer()).empty() )
                            .on( 'change', function () {
                                var val = $.fn.dataTable.util.escapeRegex(
                                    $(this).val()
                                );
         
                                column
                                    .search( val ? '^'+val+'$' : '', true, false )
                                    .draw();
                            } );
         
                        column.data().unique().sort().each( function ( d, j ) {
                            select.append( '<option value="'+d+'">'+d+'</option>' )
                        } );
                    } );
                }
            });
            globalTable = table;
        }

    });

});