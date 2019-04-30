var globalTable;

$(document).ready(function(){

    $('body').on('submit','#sendMailForm', () => { prepareDataTableExport("weekly")});

    //  1. get date from URL params
    let startDate = new URL(document.URL).searchParams.get('start_date');
    let endDate = new URL(document.URL).searchParams.get('end_date');

    //  2. insert inProgress HTML to page
    $("#example").html(`<center><i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size:150px"></i> <br><br> <h3> Getting Weekly Report... </h3> </center>`);
        
    //  3. Get Daily Report data.
    generateWeeklyReport(startDate, endDate)
    .then((data) => {
        if (data.length == 0) {
            $('#example').html("<center><h4> No blank entries. </h4><center>");
        }
        else {

            $('#example').html(`<thead><tr id="header-row"></tr></thead><tfoot><tr id="footer-row"></tr></tfoot>`);          

            //  define filename of the downloaded CSV.
            let csvFileName = startDate + '_' + endDate + '_weekly_report';

            let table = createDataTable('#example', data, false, {
                scrollX: true,
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
            });

            globalTable = table;
        }
    });
});