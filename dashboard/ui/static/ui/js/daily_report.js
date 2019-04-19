var globalTable;

$(document).ready(function(){

    $('body').on('submit','#sendMailForm', () => { prepareDataTableExport("daily"); });

    //  1. get date from URL params
    let date = new URL(document.URL).searchParams.get('date');

    //  2. insert inProgress HTML to page
    $("#example").html(`<center><i class="fa fa-spinner fa-pulse fa-3x fa-fw" style="font-size:150px"></i> <br><br> <h3> Getting Daily Report... </h3> </center>`);
    
    //  3. Get Daily Report data.
    generateDailyReport(date).then((reportData) => {

        let data = reportData['filteredFormattedReportData'];

        if (data.length == 0) {
            $('#example').html("<center><h4> No blank entries. </h4><center>");
        }
        else {

            $('#example').html(`<thead><tr id="header-row"></tr></thead><tfoot><tr id="footer-row"></tr></tfoot>`);          

            //  define filename of the downloaded CSV.
            let csvFileName = date + '_daily_report';

            let table =  createDataTable('#example', data, true, {
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

                //  4. dropdown selection for channel_name
                initComplete: function () {
                    this.api().columns([0]).every( function () {
                        let column = this;
                        let select = $('<select><option value=""></option></select>')
                            .appendTo( $(column.footer()).empty() )
                            .on( 'change', function () {
                                let val = $.fn.dataTable.util.escapeRegex(
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
                },
            });
            
            globalTable = table;
        }    
    });

});