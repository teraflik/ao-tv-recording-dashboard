// var endpoint = window.location.pathname.replace('ui', 'api');
var endpoint = document.URL.replace('ui', 'api');
console.log("The endpoint is :- " + endpoint);
var globalTable;

function updateTable() {
    console.log("Calling updateTable");
    $.getJSON(endpoint, function(data){
        globalTable.setData(data);
    });
}

$(document).ready(function(){
    //Get complete JSON data for the first time
    $.getJSON(endpoint, function(data){
        if (data.length != 0) {
            console.log(data);
            columnNames = Object.keys(data[0]);
            columnValues = []
            for (i = 0; i < columnNames.length; i++) {
                columnValues.push({title: columnNames[i], field: columnNames[i], headerFilter:"input"});
            }
    
            var table = new Tabulator("#example-table", {
                data:data, //assign data to table
                layout:"fitDataFill",
                ajaxURL:endpoint,
                ajaxProgressiveLoad:"scroll",
                paginationSize:20,
                // responsiveLayout:"hide",
                layout:"fitColumns", //fit columns to width of table (optional)
                columns: columnValues,
           });
           
           globalTable = table;    
           // setInterval(updateTable, 5000);
        } 
        else {
            $('#example-table').html("<center><h4> No entries for the given set of filters </h4><center>");
        }
    });
});