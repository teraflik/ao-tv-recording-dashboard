google.charts.load('current', {'packages':['timeline']});

var stageToColor = {
    "Start Recording":  'green',
    "Clipping Started":  'yellow',
    "Clipping Done":  'orange',
    "Uploading start":  'brown',
    "Uploading done":  'blue',
    "Stop Recording":  'red'
}

function yyyy_mm_dd(date) {
    var dd = date.getDate();
    var mm = date.getMonth() + 1; //Months are zero based
    var yyyy = date.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return yyyy + "-" + mm + "-" + dd;
  
  }

function getClipNumber(timeString) {

    var hours = parseInt(timeString.split(":")[0]);
    var minutes = parseInt(timeString.split(":")[1]);

    var clipNumber = 2 * hours + 1;

    if (minutes >= 29) {
        clipNumber += 1;
    }

    if (minutes >= 59) {
        clipNumber += 1;
    }

    return clipNumber;
}

function dateTimeFromProcessingRequestID(request_id) {
    
    var date = request_id.split("_")[0];
    var formattedDate = date[0] + date[1] + date[2] + date[3] + "-" + date[4] + date[5] + '-' + date[6] + date[7];
    var time = request_id.split("_")[2];
    var formattedTime = time[0] + time[1] + ":" + time[2] + time[3] + ":" + time[4] + time[5];

    var clipNumber = getClipNumber(formattedTime);
    var nextTimeSeconds = clipNumber * 1800;

    //  creating startTime object
    var startTime = new Date(formattedDate + " " + formattedTime);

    //  creating endTime object
    var endTime = new Date(formattedDate + " " + "00:00:00");
    endTime.setSeconds(nextTimeSeconds);
    
    return {
        'start_time': startTime,
        'end_time': endTime
    }
}

function getHighestStageNumberEntries(rawData) {

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

function initializeDataTable(endpoint) {
    var todayDate = endpoint.searchParams.get('date');

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'category' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'string', id: 'color', role: 'style' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    dataTable.addRows([['Marker', todayDate, 'grey', new Date(todayDate + " 00:00:00"), new Date(todayDate + " 23:59:59.999")]]);
    
    return dataTable;
}

function prepareDataForGoogleChartTimeline(rawData, endpoint) {

    if (!rawData) {
        return null;
    }

    if (rawData.length == 0) {
        return null;
    }

    //  1. for each request_id, get single entry having the maximum stage_number
    var highestStageNumberEntries = getHighestStageNumberEntries(rawData);
    

    var dataTableContents = [];
    // console.log("Highest stage number entries are :-");
    // console.log(highestStageNumberEntries);
    // console.log("");

    for(var i = 0; i < highestStageNumberEntries.length; i++) {
        var entry = highestStageNumberEntries[i];
        
        var category;
        var label;
        var color;
        var startTime;
        var endTime;

        label = entry['stage_message'];
        color = stageToColor[entry['stage_message']];

        if (entry['stage_number'] == 1 || entry['stage_number'] == 6) {
            category = 'Recording';
            startTime = new Date(entry['timestamp']);

            endTime = new Date(entry['timestamp']);
            endTime.setMinutes(endTime.getMinutes() + 1);
        }
        else {
            category = 'Processing';

            times = dateTimeFromProcessingRequestID(entry['request_id']);
            startTime = times['start_time'];
            startTime.setMinutes(startTime.getMinutes() + 2);
            
            endTime = times['end_time'];
            endTime.setMinutes(endTime.getMinutes() - 2);
        }

        dataTableContents.push([category, label, color, startTime, endTime]);
    }

    //  3. return it.
    return dataTableContents;
}

function populateTimeline(timeline, endpoint) {
    
    //  1. get data via ajax call
    $.ajax({
        type: 'GET',
        url: endpoint,
        async: true,
        dataType: 'json',
        success: function(rawData){
                
                //  1. debugging purpose
                // console.log("Raw Data");
                // console.log(rawData);

                //  2. prepare data in the format to be feeded to the visualisation library.
                var formattedData = prepareDataForGoogleChartTimeline(rawData, endpoint);

                //  3. create dataTable object
                var dataTable = initializeDataTable(endpoint);

                //  4. add the data to the dataTable object
                if (formattedData) {
                    dataTable.addRows(formattedData);
                }

                //  5. define options.
                var options = {
                    // timeline: { showRowLabels: false },
                    tooltip: { isHtml: false },
                    width: '100%'
                };
        
                //  6. feed data to the timeline.
                timeline.draw(dataTable, options);

                //  7. debugging
                console.log("Endpoint is :- " + endpoint.href);
                console.log(formattedData);

            }
    });
}

function initializeTimeline(endpoint) {
    var deviceID = endpoint.searchParams.get('device_id');
    var channelValue = endpoint.searchParams.get('channel_values');
    
    var divID = deviceID + "_" + channelValue;
    var container = document.getElementById(divID);
    return new google.visualization.Timeline(container);
}

function addGETParameters(baseEndPoint, GETParams) {

    var specificEndPoint = new URL(baseEndPoint);
    
    for (var key in GETParams) {
        specificEndPoint.searchParams.set(key, GETParams[key]);
    }

    return specificEndPoint;
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

function setDateInDatePicker(ID, endpoint) {
    var dateValue = endpoint.searchParams.get('date');
    var dateElement = document.getElementById(ID);
    dateElement.value = dateValue;
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    var baseEndPoint = getBaseEndPoint();

    //  patch: set the date in the datepicker
    setDateInDatePicker('date', baseEndPoint);

    //  2. make specificEndPoints array
    var specificEndPoints = [];
    for (var i = 0; i < channelValues.length; i++) {
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {"device_id": 'a', 'channel_values': channelValues[i]}));
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {"device_id": 'b', 'channel_values': channelValues[i]}));   
    }

    //  3. initialize timeline
    var timelines = [];
    for (var i = 0; i < specificEndPoints.length; i++) {
        timelines.push(initializeTimeline(specificEndPoints[i]));
    }

    //  4. populate charts with periodic refreshing
    for (var i = 0; i < timelines.length; i++) {
        populateTimeline(timelines[i], specificEndPoints[i]);
        setInterval(populateTimeline, 300000, timelines[i], specificEndPoints[i]);
    }
});

