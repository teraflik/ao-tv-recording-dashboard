/*
1. Include ui/utils.js before loading this.
*/

function setColumns(columnNames) {
    rowHtml = '';

    for(var i = 0; i < columnNames.length; i++) {
        
        var columnName = columnNames[i];
        columnHtml = '<th scope="col" class="' + columnName + '">' + columnName + '</th>';
        rowHtml += columnHtml;
    }

    $('tr#header-row').html(rowHtml);
}

$(document).ready(function(){

    //  1. obtain API endpoint that fetches data.
    var endpoint = document.URL.replace('ui', 'api');

    //  2. get JSON data.
    var data = getJSONSynchronous(endpoint);

    //  3. if no data received, return.
    if (data.length == 0) {
        $('#example').html("<center><h4> No entries for the given set of filters </h4><center>");
    }
    else {

        //  1. set column names according to attributes in JSON data.
        var columnNames = Object.keys(data[0]);
        setColumns(columnNames);
    
        //  2. get column names in the dataTable required format
        var columns = [];
        for (i = 0; i < columnNames.length; i++) {
            columns.push({"data": columnNames[i]});
        }

        //  3. create the dataTable object with required configurations
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
                                if (data == "NULL") {
                                    return data;
                                }
                                else {
                                    return '<a href="'+ data.replace("gs://", "https://storage.cloud.google.com/") + '">Stream</a>';
                                }
                    }
                }
            ],
            "data": data
        });
    }
});