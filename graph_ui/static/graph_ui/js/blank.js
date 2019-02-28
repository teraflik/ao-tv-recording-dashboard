google.charts.load('current', {'packages':['timeline']});

var globalDataTable = {};

var globalStore = {};

// var stageToColor = {
//     "Start Recording":  'green',
//     "Clipping Started":  'yellow',
//     "Clipping Done":  'orange',
//     "Uploading start":  'brown',
//     "Uploading done":  'blue',
//     "Stop Recording":  'black',
//     'blank':    'grey',
//     'Now Recording': 'lightblue',
//     'Failed':   'red'
// }

var stageToColor = {
    "Start Recording":  'green',
    "Stop Recording":  'black',
    "Normal Frame": 'grey',
    "Blank Frame": 'brown',
    "Empty": "lightblue"
}


var dataTableEnum  = Object.freeze({
    "category"    :   0, 
    "label"   :   1, 
    "tooltip" :   2,
    "color" :   3,
    "startTime" :   4,
    "endTime" :   5,
});

function yyyy_mm_dd(dateObject) {

    var dd = dateObject.getDate();
    var mm = dateObject.getMonth() + 1; //Months are zero based
    var yyyy = dateObject.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return [yyyy, mm, dd].join("-");
}

function hh_mm_ss(dateObject) {

    var hh = dateObject.getHours();
    var mm = dateObject.getMinutes();
    var ss = dateObject.getSeconds();

    if (hh < 10) {
        hh = '0' + hh;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    if (ss < 10) {
        ss = '0' + ss;
    }

    return [hh, mm, ss].join(":")
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


function initializeDataTable() {

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'category' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'string', id: 'tooltip', role: 'tooltip' });
    dataTable.addColumn({ type: 'string', id: 'color', role: 'style' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    // dataTable.addRows([['Marker', todayDate, todayDate, 'grey', new Date(todayDate + " 00:00:00"), new Date(todayDate + " 23:59:59.999")]]);
    
    return dataTable;
}

function prepareDataForGoogleChartTimeline(recordingRawData, blankRawData, endpoint) {

    var date = endpoint.searchParams.get('date');
    var startDate = new Date(date + " 00:00:00");
    
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    //  1. if no data, then return an empty grey entry
    if (!recordingRawData || recordingRawData.length == 0) {
        return [['Recording', '', 'No recordings available', stageToColor['Empty'], startDate, endDate]];
    }

    //  2. filter startStopRecordings from recordingRawData
    var startStopEntries = recordingRawData.filter(function(entry) {
        return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
    })

    //  3. if empty, return an empty grey entry.
    if (!startStopEntries || startStopEntries.length == 0) {
        return [['Recording', '', 'No recordings available', stageToColor['Empty'], startDate, endDate]];
    }


    // 4. sort startStopEntries according to timestamp
    startStopEntries.sort( (r1, r2) => {
        if (r1.timestamp < r2.timestamp) return -1;
        if (r1.timestamp > r2.timestamp) return 1;
        return 0;
    });

    //  5. make entries of "Recording" category.
    var dataTableContents = [];

    var recordingDataTableContents = [];
    for(var i = 0; i < startStopEntries.length; i++) {
        
        var entry = startStopEntries[i];
        
        //  dataTable fields
        var category;
        var label;
        var tooltip;
        var color;
        var startTimeTimeline;
        var endTimeTimeline;

        category = 'Recording';
        label = '';
        color = stageToColor[entry['stage_message']];

        startTimeTimeline = new Date(entry['timestamp']);

        endTimeTimeline = new Date(entry['timestamp']);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);

        var startTimeString = hh_mm_ss(startTimeTimeline);
        tooltip = entry['stage_message'] + ' ' + startTimeString;

        recordingDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    }

    dataTableContents = dataTableContents.concat(recordingDataTableContents);
    //  3. for each pair of start-stop entries, make a stretch in the timeline in "Blank" category
    //     also make entries for start/stop in "Recording" category
    
    for(var i = 0; i < startStopEntries.length; i += 2) {
        var startEntry = startStopEntries[i];
        var stopEntry = startStopEntries[i+1];

        dataTableContents.push(["Blank", "", "sample", "grey", new Date(startEntry['timestamp']), new Date(stopEntry['timestamp'])]);
    }

    return dataTableContents;

    // for(var i = 0; i < highestStageNumberEntries.length; i++) {
    //     var entry = highestStageNumberEntries[i];
        
    //     var category;
    //     var label;
    //     var tooltip;
    //     var color;
    //     var startTimeTimeline;
    //     var endTimeTimeline;
        
    //     var safeTyMargin = 2;

    //     // label = entry['request_id'] + ":" + entry['device_id'];

    //     label = '{"request_id": "' + entry['request_id'] + '", "device_id": "' + entry['device_id'] +'"}';
    //     // console.log("Label is " + label);

        
    //     //  color
    //     if (entry['stage_number'] == 1 || entry['stage_number'] == 6 || entry['stage_number'] == 5) {
    //         color = stageToColor[entry['stage_message']];
    //     }
    //     else {

    //         var entryTime = new Date(entry['timestamp']);
    //         var now = new Date();
    //         var hoursElapsed = (now.valueOf() - entryTime.valueOf()) / (1000 * 60 * 60);

    //         if (hoursElapsed > 24) {
    //             color = stageToColor['Failed'];
    //         }
    //         else {
    //             color = stageToColor[entry['stage_message']];
    //         }
    //     }


    //     //  start & end times and tooltip.
    //     if (entry['stage_number'] == 1 || entry['stage_number'] == 6) {
            
    //         category = 'Recording';
    //         startTimeTimeline = new Date(entry['timestamp']);

    //         endTimeTimeline = new Date(entry['timestamp']);
    //         endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
            
    //         var startTimeString = hh_mm_ss(startTimeTimeline);
    //         tooltip = entry['stage_message'] + ' ' + startTimeString;
            
    //         // console.log("Clipnumber for start/stop entries is " + entry['clip_number']);
    //     }
    //     else {

    //         category = 'Processing';

    //         times = dateTimeFromProcessingRequestID(entry['request_id']);
            
    //         var startTime = times['start_time'];
    //         startTimeTimeline = new Date(startTime);
    //         startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);
            
    //         var endTime = times['end_time'];
    //         endTimeTimeline = new Date(endTime);
    //         endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);

    //         var startTimeString = hh_mm_ss(startTime);
    //         var endTimeString = hh_mm_ss(endTime);
    //         tooltip = entry['stage_message'] + ' ' + startTimeString + ' - ' + endTimeString;
            
    //         // console.log("Clipnumber from database is " + entry['clip_number']);
    //         // console.log("Clipnumber calculated in JS is " + getClipNumber(startTimeString));
    //         // console.log(entry['clip_number'] == getClipNumber(startTimeString));
    //     }

    //     dataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    // }
}

function reverseJsonMapper(originalMapping) {
    var reverseMapping = {};

    for (key in originalMapping) {
        if (originalMapping.hasOwnProperty(key)) {
            reverseMapping[originalMapping[key]] = key;
        }
    }

    return reverseMapping;
}

function updateSummaryTable(formattedData, endpoint) {
    
    //  create a colorToStage mapping
    var colorToStage = reverseJsonMapper(stageToColor);

    //  check status
    var statusEnum  = Object.freeze({
                                        "ok"    :   1, 
                                        "blank"   :   2, 
                                        "error" :   3,
                                        "inprogress":   4
                                    });
    
    var status = statusEnum.ok;
    var colorColumn = 3;

    for(var i = 0; i < formattedData.length; i++) {
        var color = formattedData[i][colorColumn];
        var stage = colorToStage[color];

        if (stage == 'blank') {
            status = statusEnum.blank;
            break;
        }
        else if (stage == "Start Recording" || stage == "Stop Recording") {
            continue;
        }
        else if (stage == 'Failed') {
            status = statusEnum.error;
            break;
        }
        else if (stage != 'Uploading done') {
            status = statusEnum.inprogress;
        }
        // else if (stage == 'Now Recording') {
        //     console.log("Now Recording Hitted!!");
        //     status = statusEnum.inprogress;
        // }
    }

    var innerHTML;
    var bgcolor;

    
    if (status == statusEnum.error) {
        innerHTML = '&#10008;';     //  cross sign
        bgcolor = stageToColor['Failed'];
    }
    else if (status == statusEnum.blank) {
        innerHTML = '&#10067;';     //  question mark
        bgcolor = stageToColor['blank'];
    }
    else if (status == statusEnum.inprogress) {
        innerHTML = '&#10017;';     // STAR OF DAVID
        bgcolor = stageToColor['Now Recording'];
    }
    else if (status == statusEnum.ok) {
        innerHTML = '&#10004;';     //  tick sign
        bgcolor = 'green';
    }

    var deviceID = endpoint.searchParams.get('device_id');
    var channelValue = endpoint.searchParams.get('channel_values');

    var summaryBoxID = ['s', deviceID, channelValue].join("_");
    var summaryBox = document.getElementById(summaryBoxID);

    summaryBox.innerHTML = innerHTML;
    summaryBox.setAttribute('bgcolor', bgcolor);
}

function clipNoToInterval(dateString, clipNumber) {
    var startTime = new Date(dateString + " 00:00:00");
    var endTime = new Date(dateString + " 00:00:00");

    startTime.setMinutes((clipNumber - 1) * 30);
    endTime.setMinutes(clipNumber * 30);

    return [startTime, endTime];
}

function populateTimeline(timeline, endpoint, index) {

    var blankEndPoint = new URL(endpoint.href);
    var recordingEndPoint = new URL(endpoint.href.replace('blank', 'recording'));


    $.when(

        //  1. get data from recordingEndPoint
        $.get(recordingEndPoint, function(recordingRawData) {
            
            if (!globalStore[endpoint.href]) {
                globalStore[endpoint.href] = {};
            }
            
            globalStore[endpoint.href]['recordingRawData'] = recordingRawData;
        }),

        //  2. get data from blankEndPoint
        $.get(blankEndPoint, function(blankRawData) {
            
            if (!globalStore[endpoint.href]) {
                globalStore[endpoint.href] = {};
            }
            
            globalStore[endpoint.href]['blankRawData'] = blankRawData;
        })
    ).then(function() {

        var rawData = globalStore[endpoint.href]['recordingRawData'];

        var recordingRawData = globalStore[endpoint.href]['recordingRawData'];
        var blankRawData = globalStore[endpoint.href]['blankRawData'];

        //  1. debugging purpose
        // console.log("Raw Data");
        // console.log(rawData);

        
        //  2. prepare data in the format to be feeded to the visualisation library.
        var formattedData = prepareDataForGoogleChartTimeline(recordingRawData, blankRawData, endpoint);

        //  3. create dataTable object
        var dataTable = initializeDataTable();

        
        // console.log("formattedData is ....");
        // console.log(formattedData);

        //  4. add the data to the dataTable object
        dataTable.addRows(formattedData);

        //  5. define options.
        var date = endpoint.searchParams.get('date');
    
        var startDate = new Date(date + " 00:00:00");
        
        var endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        var options = {
            timeline: { showRowLabels: false, showBarLabels: false, barLabelStyle: { fontSize: 8 } },
            tooltip: { isHtml: false },
            hAxis: {
                    minValue: startDate,
                    maxValue: endDate,
                    gridlines: {color: 'pink', count: 4},
                    // format: 'HH'
                },
            width: '100%',
            height: '105'
        };
        
        //  6. feed data to the timeline.
        timeline.draw(dataTable, options);

        
        //  7. updating the globalDataTable lookup
        // globalDataTable[index] = dataTable;

        
        //  8. update the summary table : 
        //  NOTE :--> this takes formattedData and not totalFormattedData.
        // updateSummaryTable(formattedData, endpoint);
        // updateSummaryTable(totalFormattedData, endpoint);

        
        //  8. debugging
        // console.log("Endpoint is :- " + endpoint.href);
        // console.log(formattedData);
        // console.log("formattedData is ");
        // console.log(formattedData);

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
    // var baseEndPoint = new URL(document.URL.replace('graph_ui/blank', 'api/recording'));
    var baseEndPoint = new URL(document.URL.replace('graph_ui', 'api'));
  
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

function setColorLabels() {
    var table = document.getElementById("color-labels");
    var trElement = table.childNodes[1].childNodes[1];

    for (key in stageToColor) {
        if (stageToColor.hasOwnProperty(key)) {
            
            var stage = document.createElement("th");
            stage.innerText = key;

            var color = document.createElement("th");
            color.setAttribute("bgcolor", stageToColor[key]);

            trElement.appendChild(color);
            trElement.appendChild(stage);
        }
    }
}

function attachSummaryToTimeline() {
    
    for(var i = 0; i < channelValues.length; i++) {

        //  self invoking function to make a local scope for the index value which'll be used during callback.
        (function(i){

            var summaryBoxIDA = "#s_a_" + channelValues[i];
            var timelineIDA = "#a_" + channelValues[i];
    
            $(summaryBoxIDA).click(function() {
                $('html,body').animate({
                    scrollTop: $(timelineIDA).offset().top},
                    'slow');
            });
    
            var summaryBoxIDB = "#s_b_" + channelValues[i];
            var timelineIDB = "#b_" + channelValues[i];
    
            $(summaryBoxIDB).click(function() {
                $('html,body').animate({
                    scrollTop: $(timelineIDB).offset().top},
                    'slow');
            });
    
        })(i);
    }
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    var baseEndPoint = getBaseEndPoint();

    //  patch:  set the date in the datepicker
    setDateInDatePicker('date', baseEndPoint);

    //  patch:  add color labels to page top
    setColorLabels();

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

    //  2. make specificEndPoints array
    var specificEndPoints = [];
    for (var i = 0; i < channelValues.length; i++) {
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {"device_id": 'a', 'channel_values': channelValues[i]}));
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {"device_id": 'b', 'channel_values': channelValues[i]}));
    }

    //  3. initialize timeline
    var timelines = [];
    for (var i = 0; i < specificEndPoints.length; i++) {
        //  self invoking function to make a local scope for the index value which'll be used during callback.
        (function(i){
            
            timelines.push(initializeTimeline(specificEndPoints[i]));
            
            // google.visualization.events.addListener(timelines[i], 'select', function() {
            //     selectHandler(timelines[i], i);
            // });
        
        })(i);
    }

    //  4. populate charts with periodic refreshing
    for (var i = 0; i < timelines.length; i++) {
        populateTimeline(timelines[i], specificEndPoints[i], i);
        setInterval(populateTimeline, 300000, timelines[i], specificEndPoints[i], i);
    }
});