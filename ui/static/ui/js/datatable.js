// var endpoint = window.location.pathname.replace('ui', 'api');
var endpoint = document.URL.replace('ui', 'api');
console.log("inside datatable!!!");

dropdown_cols = [1, 3, 4, 5];
searchbar_cols = [0, 2];

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
    'filename': 'report.csv'
    };


    $.post(endpoint, dataToSend)
    .done(function(response, status) {
        replaceModalContentWithSuccess();
    })
    .fail(function(response, status) {
        replaceModalContentWithFailure();
    });
}

$(document).ready(function(){

    // Attach mail handler 
    $('body').on('submit','#sendMailForm', sendMailHandler);

    //  1. set the basic template for dataTable to work upon.
    var columnNames;
    $.ajax({
        type: 'GET',
        url: endpoint,
        async: false,
        dataType: 'json',
        success: function(data){
            if (data.length > 0) {
                columnNames = Object.keys(data[0]);
                setColumns(columnNames);
            }
        }
    });

    // var columnNameToIndex = createArrayValueToIndexMap(columnNames);

    if (columnNames) {
        //  2. get column names in the dataTable required format
        var columns = [];
        for (i = 0; i < columnNames.length; i++) {
            columns.push({"data": columnNames[i]});
        }

        var table =  $('#example').DataTable({
            // scrollX: true,
            // responsive: true,
            responsive: {
                details: {
                    display: $.fn.dataTable.Responsive.display.modal( {
                        header: function ( row ) {
                            var data = row.data();
                            return 'Details for '+data[0]+' '+data[1];
                        }
                    } ),
                    renderer: $.fn.dataTable.Responsive.renderer.tableAll( {
                        tableClass: 'table'
                    } )
                }
            },
            // "columnDefs": [
            //     { 
            //         "targets": columnNameToIndex['stage_number'],
            //         "visible": false
            //     }
            // ],
            dom: 'Bfrtip',
            buttons: [
                    'csv',
                    'colvis',
                    {
                        text: 'Send Mail',
                        action: function ( e, dt, node, config ) {
                            $("#myModal").modal("show");
                        }
                    },
                ],
           "ajax": {
                url: endpoint,
                dataSrc: ''
            },
            "columns": columns,
            initComplete: function () {
                this.api().columns(dropdown_cols).every( function () {
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

        $('a.toggle-vis').on( 'click', function (e) {
            e.preventDefault();
     
            // Get the column API object
            var column = table.column( $(this).attr('data-column') );
     
            // Toggle the visibility
            column.visible( ! column.visible() );
        } );

        //  4. make text boxes in footer for `searchbar_cols`
        $('#example tfoot th').each( function (i, footerColumn) {
            if (searchbar_cols.includes(i)) {
                var title = $(footerColumn).text();
                $(this).html( '<input type="text" placeholder="Search '+title+'" />' );
            }
        } );


        //  5. search feature for `searchbar_cols`
        table.columns(searchbar_cols).every(function() {
            var that = this;
            $('input', this.footer()).on('keyup change', function() {
                if ( that.search() !== this.value ) {
                    that
                        .search(this.value)
                        .draw();
                }
            });
        });

        //  6. refreshing regularly
        setInterval( function () {
            console.log("refreshing table");
            table.ajax.reload(null, false);
        }, 300000 );
    }
    else {
        $('#example').html("<center><h4> No entries for the given set of filters </h4><center>");
    }
});
