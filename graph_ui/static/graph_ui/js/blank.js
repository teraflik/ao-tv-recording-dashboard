google.charts.load('46', {'packages':['timeline']});

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
    "Stop Recording":  'red',
    "Normal Frame": 'grey',
    "Blank Frame": 'brown',
    "Empty": "lightblue",
    // "Failed": "red"
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

function removeDuplicateObjects(objectArray) {
    
    var uniqueStringArray = new Set(objectArray.map(e => JSON.stringify(e)));
    var uniqueObjectArray = Array.from(uniqueStringArray).map(e => JSON.parse(e));
    return uniqueObjectArray;
}

function createBlankDateRangeEntries(uniqueBlankRawData) {

    var blankDateRangeEntries = [];

    for(var i = 0; i < uniqueBlankRawData.length; i++) {
        entry = uniqueBlankRawData[i];

        var startTime = dateTimeFromProcessingRequestID(entry['request_id'])['start_time'];
        
        var fromMilliseconds = parseFloat(entry['invalid_frame_from']) * 1000;
        var toMilliseconds = parseFloat(entry['invalid_frame_to']) * 1000;

        var invalidFrameStartTime = new Date(startTime);
        invalidFrameStartTime.setMilliseconds(fromMilliseconds);

        var invalidFrameEndTime = new Date(startTime);
        invalidFrameEndTime.setMilliseconds(toMilliseconds);

        blankDateRangeEntries.push({"startTime": invalidFrameStartTime, "endTime": invalidFrameEndTime});
    }
    return blankDateRangeEntries;
}

function prepareRecordingSlots(startStopEntries, blankDateRangeEntries, endpoint) {
    
    //  extract date from endpoint and get today's date
    var date = endpoint.searchParams.get('date');
    var today = yyyy_mm_dd(new Date());

    var recordingSlots = [];

    var j = 0;
    for(var i = 0; i < startStopEntries.length; ) {
        
        var entry = {};
        var startRecordingDateTime;
        var stopRecordingDateTime;
        //  1. if the first entry is stop recording,
        //     then the slot will be from 
        //     dayStart - stopRecording
        if (startStopEntries[i]['stage_message'] == 'Stop Recording') {
            startRecordingDateTime = new Date(date + " 00:00:00");
            stopRecordingDateTime = new Date(startStopEntries[i]['timestamp']);

            i++;
        }
        //  2. if this entry is the last entry and its start recording,
        else if (i == startStopEntries.length - 1) {
            //  a. if its today, then the slot will be from
            //  startRecording - currentTime
            if (date == today) {
                startRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
                stopRecordingDateTime = new Date();
            }

            //  b. if its not today, then the slot will be from
            //  startRecording - dayEnd
            else {
                startRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
                stopRecordingDateTime = new Date(date + " 00:00:00");
                stopRecordingDateTime.setDate(stopRecordingDateTime.getDate() + 1);
            }
            
            i++;
        }
        else {
            startRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
            stopRecordingDateTime = new Date(startStopEntries[i+1]['timestamp']);

            i += 2;
        }

        entry['startRecordingTime'] = startRecordingDateTime;
        entry['stopRecordingTime'] = stopRecordingDateTime;
        entry['blankEntries'] = [];

        for(; j < blankDateRangeEntries.length; j++) {

            //  if the entry is beyond the current stopping time
            if (blankDateRangeEntries[j]['startTime'] > entry['stopRecordingTime']) {
                break;
            }

            entry['blankEntries'].push(blankDateRangeEntries[j]);
        }
        recordingSlots.push(entry);
    }
    return recordingSlots;
}

function prepareDataForGoogleChartTimeline(recordingRawData, blankRawData, endpoint) {

    var date = endpoint.searchParams.get('date');
    var startDate = new Date(date + " 00:00:00");
    
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    //  1. if no recordingData, then return an empty grey entry
    if (!recordingRawData || recordingRawData.length == 0) {
        return [['Empty', '', 'No recordings available', stageToColor['Empty'], startDate, endDate]];
    }

    //  2. filter startStopRecordings from recordingRawData
    var startStopEntries = recordingRawData.filter(function(entry) {
        return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
    });

    //  3. if no startStopEntries, return an empty grey entry.
    if (!startStopEntries || startStopEntries.length == 0) {
        return [['Empty', '', 'No recordings available', stageToColor['Empty'], startDate, endDate]];
    }

    // 4. sort startStopEntries according to timestamp (asc order)
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
    
    //  6. remove duplicates from blankRawData
    // console.log("blankRawData is....");
    // console.log(blankRawData);

    uniqueBlankRawData = removeDuplicateObjects(blankRawData);

    //  7. convert each entry of uniqueBlankRawData into blankDateRangeEntries
    console.log("uniqueBlankRawData is....");
    console.log(uniqueBlankRawData);

    blankDateRangeEntries = createBlankDateRangeEntries(uniqueBlankRawData);

    //  8. sort blankDateRangeEntries in order of startTime. (asc)
    blankDateRangeEntries.sort( (r1, r2) => {
        if (r1.startTime < r2.startTime) return -1;
        if (r1.startTime > r2.startTime) return 1;
        return 0;
    });

    // console.log("blankDateRangeEntries ascending sorted is....");
    // console.log(blankDateRangeEntries);

    //  9. prepare recording slots

    var recordingSlots = prepareRecordingSlots(startStopEntries, blankDateRangeEntries, endpoint);

    console.log("recordingSlots is..........");
    console.log(recordingSlots);

    //  10. create dataTable entries of "Blank" category
    var category;
    var label;
    var tooltip;
    var color;
    var startTimeTimeline;
    var endTimeTimeline;

    category = 'Blank';
    label = '';

    var blankDataTableContents = [];
    for(var i = 0; i < recordingSlots.length; i++) {

        lastEndTime = recordingSlots[i]['startRecordingTime'];
        blankEntries = recordingSlots[i]['blankEntries'];
        stopRecordingTime = recordingSlots[i]['stopRecordingTime'];

        for(var j = 0; j < blankEntries.length; j++) {
            
            var currentStartTime = blankEntries[j]['startTime'];
            var currentEndTime = blankEntries[j]['endTime'];

            //  patch: timeline cluttering issue
            if ((currentStartTime - lastEndTime) / 1000 < 1) {
                // console.log(currentStartTime);
                currentStartTime.setSeconds(currentStartTime.getSeconds() + 1);
            }

            //  1. make grey entry from lastEndTime - currentStartTime
            color = stageToColor["Normal Frame"];
            startTimeTimeline = lastEndTime;
            endTimeTimeline = currentStartTime;
            tooltip = 'Normal Frame ' + hh_mm_ss(startTimeTimeline) + ' - ' + hh_mm_ss(endTimeTimeline); 

            if (startTimeTimeline < endTimeTimeline) {
                blankDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
            }

            //  2. make blank entry from currentStartTime - currentEndTime
            color = stageToColor['Blank Frame'];
            startTimeTimeline = currentStartTime;
            endTimeTimeline = currentEndTime;
            tooltip = 'Blank Frame ' + hh_mm_ss(startTimeTimeline) + ' - ' + hh_mm_ss(endTimeTimeline);

            if (startTimeTimeline < endTimeTimeline) {
                blankDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
            }
            
            lastEndTime = currentEndTime;
        }
        
        //  make grey entry from lastEndTime - stopRecordingTime
        color = stageToColor['Normal Frame'];
        startTimeTimeline = lastEndTime;
        endTimeTimeline = stopRecordingTime;
        tooltip = 'Normal Frame ' + hh_mm_ss(startTimeTimeline) + ' - ' + hh_mm_ss(endTimeTimeline);

        if (startTimeTimeline < endTimeTimeline) {
            blankDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
        }
        
    }
    // console.log("blankDataTableContents is........");
    // console.log(blankDataTableContents);

    dataTableContents = dataTableContents.concat(blankDataTableContents);
    return dataTableContents;
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

var summaryStatusEnum  = Object.freeze({
    "ok"    :   1, 
    "blank" :   2,
    "empty"   :   3
});

// Ref:- https://stackoverflow.com/questions/21346967/using-value-of-enum-as-key-in-another-enum-in-javascript
var summaryStatusToGraphic = {
    [summaryStatusEnum.ok] : {
                            "bgcolor" : "lightgreen",
                            "innerHTML" : "&#10004;",
                            },
    [summaryStatusEnum.empty] : {
                            "bgcolor" : "lightgrey",
                            "innerHTML" : "NA",
                            },
    [summaryStatusEnum.blank] : {
                            "bgcolor" : "brown",
                            "innerHTML" : "&#10008;",
                            },
};

function updateSummaryTable(formattedData, endpoint) {
    
    //  create a colorToStage mapping
    var colorToStage = reverseJsonMapper(stageToColor);

    //  check status
    
    var status = summaryStatusEnum.ok;

    for(var i = 0; i < formattedData.length; i++) {
        var color = formattedData[i][dataTableEnum.color];
        var stage = colorToStage[color];

        if (stage == 'Empty') {
            status = summaryStatusEnum.empty;
            break;
        }
        else if (stage == "Start Recording" || stage == "Stop Recording") {
            continue;
        }
        else if (stage == 'Blank Frame') {
            status = summaryStatusEnum.blank;
            break;
        }
    }

    var innerHTML = summaryStatusToGraphic[status].innerHTML;
    var bgcolor = summaryStatusToGraphic[status].bgcolor;

    // select the DOM element corresponding to summaryBox of this channel.
    var deviceID = endpoint.searchParams.get('device_id');
    var channelValue = endpoint.searchParams.get('channel_values');


    var summaryBoxID = ['s', deviceID, channelValue].join("_");
    var summaryBox = document.getElementById(summaryBoxID);

    // fill the DOM Element with the details.
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

function updateTotalBlankMinutes(recordingRawData, blankRawData, endpoint) {

    //  get the HTML DOM element where this is going to happen
    var channelValue = endpoint.searchParams.get('channel_values');
    var deviceID = endpoint.searchParams.get('device_id');
    var divID = [deviceID, channelValue, "blank"].join("_");
    var DOMElement = document.getElementById(divID);
    
    if (!recordingRawData || recordingRawData.length == 0) {
        DOMElement.innerHTML = "No recordings available.";
        DOMElement.setAttribute('style', 'color: blue');
    }
    else if (!blankRawData || blankRawData.length == 0) {
        DOMElement.innerHTML = "No blank frames.";
        DOMElement.setAttribute('style', 'color: green');
    }
    else {
        var uniqueBlankRawData = removeDuplicateObjects(blankRawData);
        var totalBlankSeconds = 0;
        for(var i = 0; i < uniqueBlankRawData.length; i++) {
            var entry = uniqueBlankRawData[i];
            totalBlankSeconds += parseFloat(entry['invalid_frame_to']) - parseFloat(entry['invalid_frame_from']);
        }
        DOMElement.innerHTML = "" + Math.round(totalBlankSeconds / 60) + " minutes of Blank Frames.";
        DOMElement.setAttribute('style', 'color: red');
    }
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
            avoidOverlappingGridLines: false,
            width: '100%',
            height: '105'
        };
        
        //  6. feed data to the timeline.
        timeline.draw(dataTable, options);

        
        //  7. updating the globalDataTable lookup
        // globalDataTable[index] = dataTable;

        
        //  8. update the summary table : 
        updateSummaryTable(formattedData, endpoint);

        //  9. add total blank minutes
        updateTotalBlankMinutes(recordingRawData, blankRawData, endpoint);

        
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
    var table = document.getElementById("timeline-color-labels");
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

function setSummaryColorLabels() {
    var table = document.getElementById("summary-color-labels");
    var trElement = table.childNodes[1].childNodes[1];

    var summaryReverseEnum = reverseJsonMapper(summaryStatusEnum)

    for (key in summaryStatusToGraphic) {
        if (summaryStatusToGraphic.hasOwnProperty(key)) {
            
            var stage = document.createElement("th");
            stage.innerText = summaryReverseEnum[key];

            var color = document.createElement("th");
            color.setAttribute("bgcolor", summaryStatusToGraphic[key].bgcolor);
            color.innerHTML = summaryStatusToGraphic[key].innerHTML;

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
            var timelineIDA = "#a_" + channelValues[i] + "_blank";
    
            $(summaryBoxIDA).click(function() {
                $('html,body').animate({
                    scrollTop: $(timelineIDA).offset().top},
                    'slow');
            });
    
            var summaryBoxIDB = "#s_b_" + channelValues[i];
            var timelineIDB = "#b_" + channelValues[i] + "_blank";
    
            $(summaryBoxIDB).click(function() {
                $('html,body').animate({
                    scrollTop: $(timelineIDB).offset().top},
                    'slow');
            });
    
        })(i);
    }
}

function scrollToGivenID() {
    var currentURL = new URL(document.URL);
    var idToScroll = currentURL.searchParams.get('scroll_to');

    if (!idToScroll) {
        return;
    }

    $('html,body').animate({
        scrollTop: $(idToScroll).offset().top},
        'slow');
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    var baseEndPoint = getBaseEndPoint();

    //  patch:  set the date in the datepicker
    setDateInDatePicker('date', baseEndPoint);

    //  patch:  add color labels to page top
    setColorLabels();

    //  patch:  add summaryColorLabels at top of summaryTable.
    setSummaryColorLabels();

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

    //  5. scroll to given ID if specified
    setTimeout(scrollToGivenID, 2000);
});