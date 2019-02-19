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

$(document).ready(function(){

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

    if (columnNames) {
        //  2. get column names in the dataTable required format
        var columns = [];
        for (i = 0; i < columnNames.length; i++) {
            columns.push({"data": columnNames[i]});
        }

        //  3. create dataTable object with dropdown filters for `dropdown_cols`
        var table =  $('#example').DataTable({
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
