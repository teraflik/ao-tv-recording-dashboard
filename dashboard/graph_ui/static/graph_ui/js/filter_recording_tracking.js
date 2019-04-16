google.charts.load('46', {'packages':['timeline']});

var globalDataTable = {};

var stageToColor = {
    "Start Recording":  'green',
    // "Clipping Started":  'yellow',
    // "Clipping Done":  'orange',
    // "Uploading start":  'brown',
    "Uploading done":  'blue',
    "Stop Recording":  'black',
    'empty':    'grey',
    // 'Now Recording': 'lightblue',
    // 'Failed':   'red'
}

var dataTableEnum  = Object.freeze({
    "category"    :   0, 
    "label"   :   1, 
    "tooltip" :   2,
    "color" :   3,
    "startTime" :   4,
    "endTime" :   5,
});

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
    dataTable.addColumn({ type: 'string', id: 'color', role: 'tooltip' });
    dataTable.addColumn({ type: 'string', id: 'color', role: 'style' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    // dataTable.addRows([['Marker', todayDate, todayDate, 'grey', new Date(todayDate + " 00:00:00"), new Date(todayDate + " 23:59:59.999")]]);
    
    return dataTable;
}

function prepareStartStopEntries(startStopRawData, endpoint) {

    var startStopDataTableContents = [];

    for(var i = 0; i < startStopRawData.length; i++) {
        var entry = startStopRawData[i];

        var category;
        var label;
        var tooltip;
        var color;
        var startTimeTimeline;
        var endTimeTimeline;
        
        var safeTyMargin = 2;

        category = 'Recording';
        label = '';
        color = stageToColor[entry['stage_message']];
            
        startTimeTimeline = new Date(entry['timestamp']);

        endTimeTimeline = new Date(entry['timestamp']);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
        
        var startTimeString = hh_mm_ss(startTimeTimeline);
        tooltip = entry['stage_message'] + ' ' + startTimeString;
            
        startStopDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    }

    //  3. return it.
    return startStopDataTableContents;
}

function prepareProcessingEntries(filterRawData, endpoint) {
    
    var processingDataTableContents = [];

    for(var i = 0; i < filterRawData.length; i++) {
        var entry = filterRawData[i];
        
        var category;                                       //  used to 
        var label;                                          //  used for storing hidden data for each entry to be used later.
        var tooltip;
        var color;
        var startTimeTimeline;
        var endTimeTimeline;
        
        var safeTyMargin = 2;

        category = 'Processing';
        label = '';
        color = 'blue';

        times = dateTimeFromProcessingRequestID(entry['request_id']);
        
        var startTime = times['start_time'];
        startTimeTimeline = new Date(startTime);
        startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);
        
        var endTime = times['end_time'];
        endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);


        var endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + entry['clip_duration']);

        endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);

        var startTimeString = hh_mm_ss(startTime);
        var endTimeString = hh_mm_ss(endTime);
        
        tooltip = entry['device_id'] + ' ' + startTimeString + ' - ' + endTimeString;

        if (startTimeTimeline < endTimeTimeline) {
            processingDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
        }
    }

    //  3. return it.
    return processingDataTableContents;
}

function prepareDataForGoogleChartTimeline(recordingRawData, filterRawData, endpoint) {

    var date = endpoint.searchParams.get('date');
    var startDate = new Date(date + " 00:00:00");
    
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    //  extract startStopRawData for device_id = 'a'
    var startStopRawData = recordingRawData.filter(function(entry) {
        return ((entry['device_id'] == 'a') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
    });

    if (startStopRawData.length == 0) {
        startStopRawData = recordingRawData.filter(function(entry) {
            return ((entry['device_id'] == 'b') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
        });
    }

    console.log("startStopRawData is ....");
    console.log(startStopRawData);

    //  if no data recieved
    if (!startStopRawData || startStopRawData.length == 0) {
        return [['Empty', '', 'No filter recordings available', stageToColor['empty'], startDate, endDate]];
    }

    var startStopDataTableContents = prepareStartStopEntries(startStopRawData, endpoint);
    
    var processingDataTableContents = prepareProcessingEntries(filterRawData, endpoint);

    var dataTableContents = startStopDataTableContents.concat(processingDataTableContents);

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
    "empty"   :   2, 
    "error" :   3,
    "inprogress":   4,
    "blank" : 5
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
    [summaryStatusEnum.error] : {
                            "bgcolor" : "red",
                            "innerHTML" : "&#10008;",
                            },
    [summaryStatusEnum.inprogress] : {
                            "bgcolor" : "lightblue",
                            "innerHTML" : "&#10017;",
                            },
    [summaryStatusEnum.blank] : {
                            "bgcolor" : "brown",
                            "innerHTML" : "&#10004;",
                            },
};


function updateSummaryTable(formattedData, blankRawData, endpoint) {
    
    //  create a colorToStage mapping
    var colorToStage = reverseJsonMapper(stageToColor);

    //  check status
    var status;
    if (!blankRawData || blankRawData.length == 0) {
        status = summaryStatusEnum.ok;
    }
    else {
        status = summaryStatusEnum.blank;
    }

    for(var i = 0; i < formattedData.length; i++) {
        var color = formattedData[i][dataTableEnum.color];
        var stage = colorToStage[color];

        if (stage == 'empty') {
            status = summaryStatusEnum.empty;
            break;
        }
        else if (stage == "Start Recording" || stage == "Stop Recording") {
            continue;
        }
        else if (stage == 'Failed') {
            status = summaryStatusEnum.error;
            break;
        }
        else if (stage != 'Uploading done') {
            status = summaryStatusEnum.inprogress;
        }
        // else if (stage == 'Now Recording') {
        //     console.log("Now Recording Hitted!!");
        //     status = summaryStatusEnum.inprogress;
        // }
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

function getCurrentRecordingEntries(formattedData) {

    // Ref:- https://stackoverflow.com/questions/7486085/copy-array-by-value
    var formattedData = formattedData.slice();

    //  IF NO ENTRIES (will not hit this case as of now)
    if (!formattedData) {
        return [];
    }

    //  blank entry.
    if (formattedData[0][1] == '') {
        return [];
    }

    //  sort by starting timestamp (desc)
    formattedData.sort( (r1, r2) => {
        if (r1[dataTableEnum.startTime] < r2[dataTableEnum.startTime]) return 1;
        if (r1[dataTableEnum.startTime] > r2[dataTableEnum.startTime]) return -1;
        return 0;
    });

    var colorToStage = reverseJsonMapper(stageToColor);

    var lastRecordingEntry = null;
    var lastStartRecordingEntry = null;
    var lastProcessingEntry = null;
    for (var i = 0; i < formattedData.length; i++) {

        var entry = formattedData[i];
        
        //  if entry is of category Recording and its the first of this kind.
        if (!lastRecordingEntry && entry[dataTableEnum.category] == "Recording") {
            lastRecordingEntry = entry;
        }
        
        if (!lastStartRecordingEntry && colorToStage[entry[dataTableEnum.color]] == "Start Recording") {
            lastStartRecordingEntry = entry;
        }

        if (!lastProcessingEntry && entry[dataTableEnum.category] == "Processing") {
            lastProcessingEntry = entry;
        }

        if (lastRecordingEntry && lastStartRecordingEntry && lastProcessingEntry) {
            break;
        }
    }

    //  if no startRecordingEntry found
    if (!lastStartRecordingEntry) {
        return [];
    }

    //  magic happens here.......
    var currentRecordingEntries = [];

    //  1. get the latest clip number out of the formattedData entries
    var lastProcessingClipNumber = 0;
    if (!lastProcessingEntry) {
        lastProcessingClipNumber = 0;
    }
    else {
        lastProcessingClipNumber = getClipNumber(hh_mm_ss(lastProcessingEntry[dataTableEnum.startTime])) + 1;
    }

    //  2. find clip number corresponding to the latest start recording 
    var lastStartRecordingClipNumber = getClipNumber(hh_mm_ss(lastStartRecordingEntry[dataTableEnum.startTime]));

    //  3. take maximum of the above two
    var startingClipNumber = Math.max(lastProcessingClipNumber, lastStartRecordingClipNumber);

    //  4. find clip number corresponding to current time
    var currentTime = new Date();
    var currentTimeClipNumber = getClipNumber(hh_mm_ss(currentTime));

    //  5. get the endingClipNumber
    var endingClipNumber;

    //  a. if no stopRecording entry in the end
    if (lastRecordingEntry == lastStartRecordingEntry) {
        endingClipNumber = currentTimeClipNumber;
    }
    //  b. if stopRecording entry in the end
    else {
        endingClipNumber = getClipNumber(hh_mm_ss(lastRecordingEntry[dataTableEnum.startTime])) - 1;
    }

    //  6. make entries for the missing clip numbers
    var safeTyMargin = 2;
    for (var i = startingClipNumber; i <= endingClipNumber; i++) {
        
        var stageMessage = 'Now Recording';
        //  category
        var category = 'Processing';

        //  label
        var label = stageMessage;

        var [startTime, endTime] = clipNoToInterval(yyyy_mm_dd(new Date()), i);

        var startTimeString = hh_mm_ss(startTime);
        var endTimeString = hh_mm_ss(endTime);
        
        //  startTimeTimeline
        var startTimeTimeline = new Date(startTime);
        startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);

        //  endTimeTimeline
        var endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);
        
        //  color
        //  see if difference between current_time and the startTime of this entry is more than 1hr, then make this "Failure", else use original stageMessage
        var color;
        var hoursElapsed = (currentTime - startTime) / (60 * 60 * 1000)
        
        if (hoursElapsed > 1) {
            stageMessage = 'Failed';
        }

        color = stageToColor[stageMessage];

        //  tooltip
        var tooltip = stageMessage + ' ' + startTimeString + ' - ' + endTimeString;
        
        //  add entry
        currentRecordingEntries.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    }
    return currentRecordingEntries;
}

function removeDuplicateObjects(objectArray) {
    
    // console.log("objectArray is ......");
    // console.log(objectArray);

    var uniqueStringArray = new Set(objectArray.map(e => JSON.stringify(e)));
    var uniqueObjectArray = Array.from(uniqueStringArray).map(e => JSON.parse(e));
    return uniqueObjectArray;
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

function makeClipNoToProcessingEntry(processingEntries) {
    
    var clipNoToProcessingEntry = {};
    
    for(var i = 0; i < processingEntries.length; i++) {
        var entry = processingEntries[i];
        var startTime = entry[dataTableEnum.startTime];

        var clipNumber = getClipNumber(hh_mm_ss(startTime));
        clipNoToProcessingEntry[clipNumber] = entry;
    }

    return clipNoToProcessingEntry;
}

function createRecordingSlots(startStopEntries, endpoint) {
    
    //  sort the startStopEntries according to timestamp in ASC order.
    startStopEntries.sort( (r1, r2) => {
        if (r1.timestamp < r2.timestamp) return -1;
        if (r1.timestamp > r2.timestamp) return 1;
        return 0;
    });
    
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
            
            //  jugaad: to prevent entering the next clipNumber
            stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);

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
    
                //  jugaad: to prevent entering the next clipNumber
                stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);
            }
            
            i++;
        }
        else {
            startRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
            stopRecordingDateTime = new Date(startStopEntries[i+1]['timestamp']);

            //  jugaad: to prevent entering the next clipNumber
            stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);

            i += 2;
        }

        entry['startRecordingTime'] = startRecordingDateTime;
        entry['stopRecordingTime'] = stopRecordingDateTime;

        recordingSlots.push(entry);
    }
    return recordingSlots;
}

function getDummyEntries(recordingSlots, clipNoToProcessingEntry, endpoint) {
    
    var dummyEntries = [];
    var inputDate = endpoint.searchParams.get('date');

    var currentTime = new Date();

    //  loop over recording slots
    for(var i = 0; i < recordingSlots.length; i++) {
        
        //  1. convert the start and end times to their corresponding clipNumbers
        var startRecordingTime = recordingSlots[i]['startRecordingTime'];
        var stopRecordingTime = recordingSlots[i]['stopRecordingTime'];

        var startClipNumber = getClipNumber(hh_mm_ss(startRecordingTime));
        var stopClipNumber = getClipNumber(hh_mm_ss(stopRecordingTime));

        // console.log("startClipNumber is........ " + startClipNumber);

        var safeTyMargin = 2;

        //  2. loop through the clipNumbers
        for (var j = startClipNumber; j <= stopClipNumber; j++) {

            //  3. check if entry corresponding to that clipNumber is present in the mapping - clipNoToProcessingEntry
            if (!clipNoToProcessingEntry[j]) {
                // console.log("clipNumber " + j + " is missing.");

                //  4. if not, create a dummy entry.
                var [startTime, endTime] = clipNoToInterval(inputDate, j);
                var startTimeString = hh_mm_ss(startTime);
                var endTimeString = hh_mm_ss(endTime);

                var category = 'Processing';

                var stageMessage = 'Now Recording';
                var hoursElapsed = (currentTime - startTime) / (60 * 60 * 1000);
                
                if (hoursElapsed > 1) {
                    stageMessage = 'Failed';
                }

                var label = stageMessage;
                var tooltip = stageMessage + " - " + startTimeString + " - " + endTimeString;
                var color = stageToColor[stageMessage];
                
                startTime.setMinutes(startTime.getMinutes() + safeTyMargin);
                endTime.setMinutes(endTime.getMinutes() - safeTyMargin);

                dummyEntries.push([category, label, tooltip, color, startTime, endTime]);
            }
        }

        // console.log("stopClipNumber is........ " + stopClipNumber);
    }

    return dummyEntries;
}

function populateTimeline(timeline, endpoint, index) {
    
    var filterEndPoint = new URL(endpoint.href);

    //  1. making corresponding endpoint for recording table.
    var recordingEndPoint = new URL(endpoint.href);

    var url = document.createElement('a');
    url.href = endpoint.href;
    var protocol = url.protocol;
    var host = url.host;
    var path = '/api/recording';
    var searchParams = url.search;
    var recordingEndPoint = new URL(protocol + "//" + host + path + searchParams);
    // console.log("recordingEndPoint is .... " + recordingEndPoint.href);

    $.when(

        //  1. get data from endpoint
        $.get(filterEndPoint),

        //  1. get data from recordingEndPoint
        $.get(recordingEndPoint)

    ).then(function(filterEndPointResponse, recordingEndPointResponse) {
        
        var filterRawData = filterEndPointResponse[0];
        var recordingRawData = recordingEndPointResponse[0];

        console.log("filterRawData is.......");
        console.log(filterRawData);

        console.log("recordingRawData is.......");
        console.log(recordingRawData);

        //  2. prepare data in the format to be feeded to the visualisation library.
        var formattedData = prepareDataForGoogleChartTimeline(recordingRawData, filterRawData, endpoint);

        console.log("formattedData is.......");
        console.log(formattedData);

        // //  2.1 filter out recordingEntries and processingEntries
        // var startStopEntries = recordingRawData.filter(function(entry) {
        //     return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
        // });

        // //  2.2 sort these according to their timestamp (asc)
        // startStopEntries.sort( (r1, r2) => {
        //     if (r1.timestamp < r2.timestamp) return -1;
        //     if (r1.timestamp > r2.timestamp) return 1;
        //     return 0;
        // });


        // console.log("startStopEntries sorted are.........");
        // console.log(startStopEntries);

        // //  2.3 filter the processing entries
        // var processingEntries = formattedData.filter(function(dataTableEntry) {
        //     return dataTableEntry[dataTableEnum.category] == 'Processing';
        // });

        // console.log("processingEntries are.........");
        // console.log(processingEntries);

        // //  2.4 create a mapping of clipNumber --> processingEntry
        // var clipNoToProcessingEntry = makeClipNoToProcessingEntry(processingEntries);
        // console.log("clipNoToProcessingEntry is........");
        // console.log(clipNoToProcessingEntry);

        // //  2.5 make recording slots
        // var recordingSlots = createRecordingSlots(startStopEntries, endpoint);
        // console.log("Recording Slots are......");
        // console.log(recordingSlots);


        // var dummyEntries = getDummyEntries(recordingSlots, clipNoToProcessingEntry, endpoint);
        // console.log("dummyEntries are.......");
        // console.log(dummyEntries);


        // //  3. If its today's date, then add current recordings
        var date = endpoint.searchParams.get('date');
        // var device_id = endpoint.searchParams.get('device_id');
        // // var currentRecordingEntries = [];
        // // var today = yyyy_mm_dd(new Date());
        
        // // if (date == today) {
        // //     currentRecordingEntries = getCurrentRecordingEntries(formattedData);
        // // }

        // // // currentRecordingEntries = getCurrentRecordingEntries(formattedData);

        // // var totalFormattedData = formattedData.concat(currentRecordingEntries);

        // var totalFormattedData = formattedData.concat(dummyEntries);

        // console.log("totalFormattedData is ....");
        // console.log(totalFormattedData);

        var totalFormattedData = formattedData;

        //  3. create dataTable object
        var dataTable = initializeDataTable();

        
        //  4. add the data to the dataTable object
        dataTable.addRows(totalFormattedData);

        
        //  5. define options.
        var startDate = new Date(date + " 00:00:00");
        
        var endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        var options = {
            timeline: { showRowLabels: false, showBarLabels: false, barLabelStyle: { fontSize: 9 } },
            tooltip: { isHtml: false },
            hAxis: {
                    minValue: startDate,
                    maxValue: endDate,
                    gridlines: {color: 'pink', count: 4},
                    // format: 'HH'
                },
            width: '100%',
            height: '140'
        };

        
        //  6. feed data to the timeline.
        timeline.draw(dataTable, options);

        
        //  7. updating the globalDataTable lookup
        globalDataTable[index] = dataTable;

        
        //  8. update the summary table : 
        //  NOTE :--> this takes formattedData and not totalFormattedData.
        // updateSummaryTable(formattedData, endpoint);
        // updateSummaryTable(totalFormattedData, blankRawData, endpoint);

        //  9. add total blank minutes
        // updateTotalBlankMinutes(recordingRawData, blankRawData, endpoint);

        // //  10. create entries in report (if its not today's date and device_id = 'a' {either one will do.})
        // if (date != yyyy_mm_dd(new Date()) && device_id == 'a') {
        //     generateDailyReport(filterRecordingTrackingEndPoint, filterRecordingTrackingRawData, recordingSlots);
        // }

    });
}

function initializeTimeline(endpoint) {
    var channelValue = endpoint.searchParams.get('channel_values');
    
    var divID = "filter_" + channelValue;
    var container = document.getElementById(divID);
    return new google.visualization.Timeline(container);
}

function getBaseEndPoint() {

    //  Get the REST API endpoint to hit from current URL.
    var baseEndPoint = new URL(document.URL.replace('graph_ui', 'api'));
  
    //  If no date passed, add today's date
    if (!baseEndPoint.searchParams.get('date')) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate()  - 1);

        baseEndPoint.searchParams.set('date', yyyy_mm_dd(yesterday));
    }

    //  Remove search parameters other than date.
    var parameters = Array.from(baseEndPoint.searchParams.keys()).filter(x => x != 'date');
    for (var i = 0; i < parameters.length; i++) {
        baseEndPoint.searchParams.delete(parameters[i]);
    }
    console.log("baseEndPoint is :-> " + baseEndPoint.href);
    return baseEndPoint;
}

function setDateInDatePicker(datePickerElementID, endpoint) {
    var dateValue = endpoint.searchParams.get('date');
    var dateElement = document.getElementById(datePickerElementID);
    dateElement.value = dateValue;
}

function selectHandler(timeline, index) {

    var selectedDataTable = globalDataTable[index];
    var selection = timeline.getSelection()[0];
    var rowNo = selection.row;
    var label = selectedDataTable.getValue(rowNo, dataTableEnum.label);
    
    var labelJSON;
    
    //  if label isn't a JSON dump, then simply skip.
    try {
        labelJSON = JSON.parse(label);
    }
    catch(err) {
        return;
    }

    //  a. this was for on-click: table-view redirect
    var GETparams = labelJSON;
    var redirectURL = new URL(window.location.origin + "/ui/recording_graph_ui_redirect");

    for (key in GETparams) {
        redirectURL.searchParams.set(key, GETparams[key]);
    }

    // //  b. this is for on-click: graph_view redirect
    // var redirectURL = new URL(labelJSON['video_path'].replace("gs://", "https://storage.cloud.google.com/"));
    // console.log(redirectURL.href);


    window.open(redirectURL);
}

function setTimelineColorLabels() {
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

            var summaryBoxIDA = "#s_filter_" + channelValues[i];
            var timelineIDA = "#filter_" + channelValues[i] + "_blank";
    
            $(summaryBoxIDA).click(function() {
                $('html,body').animate({
                    scrollTop: $(timelineIDA).offset().top},
                    'slow');
            });
    
        })(i);
    }
}

function linkToBlankFramesUI() {
    
    //  get the current URL & change it to get the URL for blank UI
    
    //  this one has bug
    //  recording.athenasowl.tv/graph_ui/recording?date=.... --> blank.athenasowl.tv/graph_ui/recording?date=...
    //  var baseURL = new URL(document.URL.replace('recording', 'blank'));

    //  new logic
    var protocol = window.location.protocol;
    var host = window.location.host;
    var path = window.location.pathname.replace('recording', 'blank');
    var searchParams = window.location.search;

    var baseURL = new URL(protocol + "//" + host + path + searchParams);

    //  loop for generating specific URLs
    for(var i = 0; i < channelValues.length; i++) {
        //  device_id = 'a'
        //  get the corresponding anchor tag and set its href to the specific URL.
        var aID = document.getElementById(channelValues[i] + '_blank');
        var specificURL = new URL(baseURL.href);
        specificURL.searchParams.set('scroll_to', '#' + channelValues[i] + "_blank");
        aID.setAttribute("href", specificURL.href);
    }
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    var baseEndPoint = getBaseEndPoint();

    //  patch:  set the date in the datepicker
    setDateInDatePicker('date', baseEndPoint);

    //  patch:  add color labels to page top
    setTimelineColorLabels();

    //  patch:  add summaryColorLabels at top of summaryTable.
    // setSummaryColorLabels();

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

    // //  patch: link to blankFrames UI <NOT_REQUIRED>
    // linkToBlankFramesUI();

    //  2. make specificEndPoints array
    var specificEndPoints = [];
    for (var i = 0; i < channelValues.length; i++) {
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {'channel_values': channelValues[i]}));
    }

    //  3. initialize timeline
    var timelines = [];
    for (var i = 0; i < specificEndPoints.length; i++) {
        //  self invoking function to make a local scope for the index value which'll be used during callback.
        (function(i){
            
            timelines.push(initializeTimeline(specificEndPoints[i]));

            //  no eventHandler required as of now.
            // google.visualization.events.addListener(timelines[i], 'select', function() {
            //     selectHandler(timelines[i], i);
            // });
        
        })(i);
    }

    //  debug: print the specificEndPoints array
    for (var i = 0; i < specificEndPoints.length; i++) {
        // console.log("specificEndpoint Number " + i + " is " + specificEndPoints[i].href);
    }

    //  4. populate charts with periodic refreshing
    for (var i = 0; i < timelines.length; i++) {
        populateTimeline(timelines[i], specificEndPoints[i], i);
        //  Since this isn't live tracking, no need to refresh every 5 mins. Manual refresh is enough.
    }
});