function yyyy_mm_dd(date) {
    var curr_date = date.getDate();
    var curr_month = date.getMonth() + 1; //Months are zero based
    var curr_year = date.getFullYear();
    return curr_year + "-" + curr_month + "-" + curr_date;
  
  }

function prepareEndpoint() {
    //  In future, this will take a key value pair as argument which would be set as the URL parameters.
    var generalEndpoint = new URL(document.URL.replace('graph_ui/d3-timeline', 'api/get'));
  
    // Endpoint for Sony Channel, device_id=a
    var sonyDeviceAEndpoint = new URL(generalEndpoint);
  
    if (!sonyDeviceAEndpoint.searchParams.get('date')) {
      sonyDeviceAEndpoint.searchParams.set('date', yyyy_mm_dd(new Date()));
    }

    return sonyDeviceAEndpoint;
  }

function getData(endpoint) {
    var toBeReturned;
    
    $.ajax({
        type: 'GET',
        url: endpoint,
        async: false,
        dataType: 'json',
        success: function(rawData){
                    toBeReturned = rawData;
                }
    });
    
    return toBeReturned;
}

function formatData(rawData, endpoint) {
}

function plotGraph(formattedData, endpoint) {
    // configure the timeline
    google.charts.load('current', {'packages':['timeline']});
    google.charts.setOnLoadCallback(drawChart);

    var globalData;
    var globalChart;

    function drawChart() {
        var container = document.getElementById('timeline');
        var chart = new google.visualization.Timeline(container);
        var dataTable = new google.visualization.DataTable();

        dataTable.addColumn({ type: 'string', id: 'category' });
        dataTable.addColumn({ type: 'string', id: 'Name' });
        dataTable.addColumn({ type: 'string', id: 'style', role: 'style' });
        dataTable.addColumn({ type: 'string', role: 'tooltip' });
        dataTable.addColumn({ type: 'date', id: 'Start' });
        dataTable.addColumn({ type: 'date', id: 'End' });
        dataTable.addRows([
            ['Marker', '2019-01-01', 'blue', 'hello', new Date("2019-01-01 00:00"), new Date("2019-01-02 00:00")],
            [ 'Recording', 'Start Recording', 'green', 'world', new Date("2019-01-01 17:30"), new Date("2019-01-01 17:31")],
            [ 'Recording', 'Stop Recording', 'red', 'please', new Date("2019-01-01 23:30"),  new Date("2019-01-01 23:31")],
            [ 'Processing', 'Uploaded', 'Yellow', 'work', new Date("2019-01-01 17:30"), new Date("2019-01-01 18:00")],
            [ 'Processing', 'Clipping', 'Orange', 'please!!', new Date("2019-01-01 18:00"), new Date("2019-01-01 18:30")]]);
        
        globalData = dataTable;

        var options = {
            timeline: { showRowLabels: false },
            tooltip: { isHtml: false },
            width: 1200
        };

        chart.draw(dataTable, options);
        
        var globalChart = chart;
    }

    // setInterval(function() {
    //               updateTimeline(chart, "#sony");
    // }, 10000);
}

function main(rawData, endpoint) {
    //  fill in data according 
    var formattedData = formatData(rawData, endpoint);
    globalRawData = rawData;
    plotGraph(formattedData, endpoint);
}


$(document).ready(function(){

    //  1. prepare the API endpoint to be hit.
    var endpoint = prepareEndpoint();
    console.log("The endpoint is :- " + endpoint);
  
    //  2. get the data from the endpoint.
    var rawData = getData(endpoint);
    console.log("data recieved is :- ");
    console.log(rawData);
    
    main(rawData, endpoint);
});