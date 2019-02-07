// var endpoint = window.location.pathname.replace('ui', 'api');
var endpoint = document.URL.replace('ui', 'api');
console.log("inside datatable!!!");

function setColumns(columnNames) {

    headerRowHtml = '';
    footerRowHtml = '';

    $.each(columnNames, function(i, columnName) {
        headerColumnHtml = '<th scope="col">' + columnName + '</th>';
        footerColumnHtml = '<th scope="col"><input type="text" placeholder="Search '+columnName+'" /></th>';

        headerRowHtml += headerColumnHtml;
        footerRowHtml += footerColumnHtml;
    });

    $('tr#header-row').html(headerRowHtml);
    $('tr#footer-row').html(footerRowHtml);
}

$(document).ready(function(){

    //  1. define the attributes of the table
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
        //  2. get entries and fill the table
        var columns = [];
        for (i = 0; i < columnNames.length; i++) {
            columns.push({"data": columnNames[i]});
        }

        var table =  $('#example').DataTable({
            "ajax": {
                url: endpoint,
                dataSrc: ''
            },
            "columns": columns
        });


        //  3. search feature for each individual field
        table.columns().every(function() {
            var that = this;
            $('input', this.footer()).on('keyup change', function() {
                if ( that.search() !== this.value ) {
                    that
                        .search(this.value)
                        .draw();
                }
            });
        });

        //  4. refreshing regularly
        setInterval( function () {
            console.log("refreshing table");
            table.ajax.reload(null, false);
        }, 300000 );
    }
    else {
        $('#example').html("<center><h4> No entries for the given set of filters </h4><center>");
    }
});
