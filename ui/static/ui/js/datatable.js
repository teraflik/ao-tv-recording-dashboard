
/**
 * Set the column names according to the attributes in the JSON Response.
 * @param {string} endpoint - The API endpoint that serves the data.
 * @param {string} headerQuerySelector - querySelector of <thead>
 * @param {string} footerQuerySelector - querySelector of <tfoot>
 * @returns {}
 */
function setColumnsAsPerData(endpoint, headerQuerySelector, footerQuerySelector) {
    var data = getJSONSynchronous(endpoint);
    if (data.length > 0) {

    }
}

function setColumns(columnNames) {

    rowHtml = '';

    for(var i = 0; i < columnNames.length; i++) {
        
        var columnName = columnNames[i];
        columnHtml = '<th scope="col" class="' + columnName + '">' + columnName + '</th>';
        rowHtml += columnHtml;
    }

    $('tr#header-row').html(rowHtml);
}

function videoPathToURL(data) {
    if (data == "NULL") {
        return data;
    }
    else {
        return '<a href="'+ data.replace("gs://", "https://storage.cloud.google.com/") + '">Stream</a>';
    }
}

$(document).ready(function(){

    //  1. obtain API endpoint that fetches data.
    var endpoint = document.URL.replace('ui', 'api');

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

        var table =  $('#example').DataTable({
            "columns": columns,
            "columnDefs": [
                { 
                    "targets": "stage_number",
                    "visible": false
                },
                {
                    "targets": "video_path",
                    "render": function ( data, type, row, meta ) {
                                return videoPathToURL(data);
                    }
                }
            ],
            "ajax": {
                url: endpoint,
                dataSrc: ''
            },
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
