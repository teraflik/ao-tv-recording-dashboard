function yyyy_mm_dd(date) {
    var curr_date = date.getDate();
    var curr_month = date.getMonth() + 1; //Months are zero based
    var curr_year = date.getFullYear();
    return curr_year + "-" + curr_month + "-" + curr_date;
  
  }

var globalDataTable;
var globalChart;
var globalOptions;

// function formatData(rawData, endpoint) {
// }

// function plotGraph(formattedData, endpoint) {
//     // configure the timeline
//     google.charts.load('current', {'packages':['timeline']});
//     google.charts.setOnLoadCallback(drawChart);

//     function drawChart() {
//         var container = document.getElementById('a_1');
//         var chart = new google.visualization.Timeline(container);
//         var dataTable = new google.visualization.DataTable();

//         dataTable.addColumn({ type: 'string', id: 'category' });
//         dataTable.addColumn({ type: 'string', id: 'Name' });
//         dataTable.addColumn({ type: 'string', id: 'style', role: 'style' });
//         dataTable.addColumn({ type: 'string', role: 'tooltip' });
//         dataTable.addColumn({ type: 'date', id: 'Start' });
//         dataTable.addColumn({ type: 'date', id: 'End' });
//         dataTable.addRows([
//             ['Marker', '2019-01-01', 'blue', 'hello', new Date("2019-01-01 00:00"), new Date("2019-01-02 00:00")],
//             [ 'Recording', 'Start Recording', 'green', 'world', new Date("2019-01-01 17:30"), new Date("2019-01-01 17:31")],
//             [ 'Recording', 'Stop Recording', 'red', 'please', new Date("2019-01-01 23:30"),  new Date("2019-01-01 23:31")],
//             [ 'Processing', 'Uploaded', 'Yellow', 'work', new Date("2019-01-01 17:30"), new Date("2019-01-01 18:00")],
//             [ 'Processing', 'Clipping', 'Orange', 'please!!', new Date("2019-01-01 18:00"), new Date("2019-01-01 18:30")]]);
        
//         globalDataTable = dataTable;

//         var options = {
//             timeline: { showRowLabels: false },
//             tooltip: { isHtml: false },
//             width: '100%'
//         };
//         globalOptions = options;

//         chart.draw(dataTable, options);
        
//         globalChart = chart;
//     }

//     // setInterval(function() {
//     //               updateTimeline(chart, "#sony");
//     // }, 10000);
// }

// function main(rawData, endpoint) {
//     //  fill in data according 
//     var formattedData = formatData(rawData, endpoint);
//     globalRawData = rawData;
//     plotGraph(formattedData, endpoint);
// }

var globalRawData;

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
    
    globalRawData = toBeReturned;
    return toBeReturned;
}

function getBaseEndPoint() {

    //  Get the REST API endpoint to hit from current URL.
    var baseEndPoint = new URL(document.URL.replace('graph_ui/google-charts-timeline', 'api/get'));
  
    //  If no date passed, add today's date
    if (!baseEndPoint.searchParams.get('date')) {
        baseEndPoint.searchParams.set('date', yyyy_mm_dd(new Date()));
    }

    return baseEndPoint;
}

var globalLatestEntries;

function getHighestStageNumberEntries(rawData) {

    if (!rawData) {
        return [];
    }

    //  1. sort by stage_number (desc)
    rawData.sort( (r1, r2) => {
        if (r1.stage_number < r2.stage_number) return 1;
        if (r1.stage_number > r2.stage_number) return -1;
        return 0;
    });

    //  2. sort by request_id(asc)
    rawData.sort( (r1, r2) => {
        if (r1.request_id < r2.request_id) return -1;
        if (r1.request_id > r2.request_id) return 1;
        return 0;
    });

    var highestStageNumberEntries = [rawData[0]];
    for(var i = 1; i < rawData.length; i++) {

        if (rawData[i]['stage_message'] == "Stop Recording" || rawData[i]['stage_message'] == "Start Recording") {
            highestStageNumberEntries.push(rawData[i]);
        }
        else {
            var lastIndex = highestStageNumberEntries.length - 1;
            if (highestStageNumberEntries[lastIndex]['request_id'] != rawData[i]['request_id']) {
                highestStageNumberEntries.push(rawData[i]);
            }
        }
    }
    return highestStageNumberEntries;
}

function prepareDataForGoogleChartTimeline(rawData) {

    //  1. for each request_id, get single entry having the maximum stage_number
    var latestEntries = getHighestStageNumberEntries(rawData);

    //  2. map each entry in this new list to required dataTable format.

    //  3. return it.
    return latestEntries;
}

function createLiveTimeline(baseEndPoint, getParams) {
    
    //  1. create a new URL object.
    var specificEndPoint = new URL(baseEndPoint);
    
    //  2. add the get params to the baseEndPoint
    for (var key in getParams) {
        specificEndPoint.searchParams.set(key, getParams[key]);
    }
    
    //  3. hit the endpoint and get the RAW data
    var rawData = getData(specificEndPoint);

    //  4. prepare data in the format to be feeded to the visualisation library.
    var formattedData = prepareDataForGoogleChartTimeline(rawData);

    //  5. send this data to the drawChart function

    //  6. enclose 3, 4, 5 in a single function and call it in regular intervals.




    console.log("Endpoint:--> " + specificEndPoint.href);
    
    console.log("Raw Data");
    console.log(rawData);
    
    console.log("formattedData");
    console.log(formattedData);
}

$(document).ready(function(){

    //  1. get base endpoint
    var baseEndPoint = getBaseEndPoint();

    // channelValues = [1];
    //  2. call the create timeline for each channel
    for(var i = 0; i < channelValues.length; i++) {
        createLiveTimeline(baseEndPoint.href, {"device_id": 'a', 'channel_values': channelValues[i]});
        createLiveTimeline(baseEndPoint.href, {"device_id": 'b', 'channel_values': channelValues[i]});    
    }

});