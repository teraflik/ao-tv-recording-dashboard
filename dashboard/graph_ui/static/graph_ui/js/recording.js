google.charts.load('46', {'packages':['timeline']});

var globalDataTable = {};

var stageToColor = {
    "Start Recording":  'green',
    "Clipping Started":  'yellow',
    "Clipping Done":  'orange',
    "Uploading start":  'brown',
    "Uploading done":  'blue',
    "Stop Recording":  'black',
    'empty':    'grey',
    'Now Recording': 'lightblue',
    'Failed':   'red'
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

function prepareDataForGoogleChartTimeline(rawData, endpoint) {

    var date = endpoint.searchParams.get('date');
    var startDate = new Date(date + " 00:00:00");
    
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    if (!rawData || rawData.length == 0) {
        return [['Empty', '', 'No recordings available', stageToColor['empty'], startDate, endDate]];
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
        var tooltip;
        var color;
        var startTimeTimeline;
        var endTimeTimeline;
        
        var safeTyMargin = 2;

        //  label
        //  a. this was for on-click: tableview redirect
        label = '{"request_id": "' + entry['request_id'] + '", "device_id": "' + entry['device_id'] +'"}';

        // //  b. this is for on-click: redirect to bucket video.
        // if (entry['stage_number'] == 5) {
        //     label = '{"video_path": "' + entry['video_path'] +'"}';
        // }
        // else {
        //     label = '';
        // }

        //  color
        if (entry['stage_number'] == 1 || entry['stage_number'] == 6 || entry['stage_number'] == 5) {
            color = stageToColor[entry['stage_message']];
        }
        else {

            var entryTime = new Date(entry['timestamp']);
            var now = new Date();
            var hoursElapsed = (now.valueOf() - entryTime.valueOf()) / (1000 * 60 * 60);

            if (hoursElapsed > 24) {
                color = stageToColor['Failed'];
            }
            else {
                color = stageToColor[entry['stage_message']];
            }
        }


        //  start & end times and tooltip.
        if (entry['stage_number'] == 1 || entry['stage_number'] == 6) {
            
            category = 'Recording';
            startTimeTimeline = new Date(entry['timestamp']);

            endTimeTimeline = new Date(entry['timestamp']);
            endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
            
            var startTimeString = hh_mm_ss(startTimeTimeline);
            tooltip = entry['stage_message'] + ' ' + startTimeString;
            
            // console.log("Clipnumber for start/stop entries is " + entry['clip_number']);
        }
        else {

            category = 'Processing';

            times = dateTimeFromProcessingRequestID(entry['request_id']);
            
            var startTime = times['start_time'];
            startTimeTimeline = new Date(startTime);
            startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);
            
            var endTime = times['end_time'];
            endTimeTimeline = new Date(endTime);
            endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);

            var startTimeString = hh_mm_ss(startTime);
            var endTimeString = hh_mm_ss(endTime);
            tooltip = entry['stage_message'] + ' ' + startTimeString + ' - ' + endTimeString;
            
            // console.log("Clipnumber from database is " + entry['clip_number']);
            // console.log("Clipnumber calculated in JS is " + getClipNumber(startTimeString));
            // console.log(entry['clip_number'] == getClipNumber(startTimeString));
        }

        if (startTimeTimeline < endTimeTimeline) {
            dataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
        }
    }

    //  3. return it.
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

function removeDuplicateObjects(objectArray) {

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
        DOMElement.innerHTML = "" + (totalBlankSeconds / 60).toFixed(2) + " minutes of Blank Frames.";
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
        //     and corresponding clipNumber is 1, then skip it.

        //  1. if the first entry is stop recording,
        //     then the slot will be from 
        //     dayStart - stopRecording
        if (startStopEntries[i]['stage_message'] == 'Stop Recording') {

            startRecordingDateTime = new Date(date + " 00:00:00");
            stopRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
            
            if (getClipNumber(hh_mm_ss(stopRecordingDateTime)) == 1) {
                i++;
                continue;
            }
            else {
                //  jugaad: to prevent entering the next clipNumber
                stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);
                i++;
            }
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
            
                //  4. if not, create a dummy entry.
                var [startTime, endTime] = clipNoToInterval(inputDate, j);
                
                if (j == startClipNumber) {
                    startTime = startRecordingTime;
                }

                if (j == stopClipNumber) {
                    endTime = stopRecordingTime;
                }
                
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

                if (startTime < endTime) {
                    dummyEntries.push([category, label, tooltip, color, startTime, endTime]);                        
                }
            }
        }

        // console.log("stopClipNumber is........ " + stopClipNumber);
    }

    return dummyEntries;
}

function populateTimeline(timeline, endpoint, index) {
    
    //  1. get the endpoint for recording_table
    var recordingEndPoint = new URL(endpoint.href);

    //  this one has bug
    //  recording.athenasowl.tv/graph_ui/recording?date=... --> blank.athenasowl.tv/graph_ui/blank?date=...
    //  var blankEndPoint = new URL(endpoint.href.replace('recording', 'blank'));
    
    //  2. get the endpoint for invalid_frame_tracking_table
    //  creating an element with capability to extract protocol, host, path, etc...
    var url = document.createElement('a');
    url.href = endpoint.href;
    var protocol = url.protocol;
    var host = url.host;
    var path = url.pathname.replace('recording', 'blank');
    var searchParams = url.search;
    var blankEndPoint = new URL(protocol + "//" + host + path + searchParams);
    // console.log("blankEndPoint is .... " + blankEndPoint.href);

    //  3. get the endpoint for filter_recording_tracking_table
    var url = document.createElement('a');
    url.href = endpoint.href;
    var protocol = url.protocol;
    var host = url.host;
    var path = url.pathname.replace('recording', 'filter_recording_tracking');
    var searchParams = url.search;
    var filterRecordingTrackingEndPoint = new URL(protocol + "//" + host + path + searchParams);
    filterRecordingTrackingEndPoint.searchParams.delete("device_id");

    // console.log("filterRecordingTrackingEndPoint is .... " + filterRecordingTrackingEndPoint.href);

    $.when(

        //  1. get data from recordingEndPoint
        $.get(recordingEndPoint),

        //  2. get data from blankEndPoint
        $.get(blankEndPoint)

    ).then(function(recordingEndPointResponse, blankEndPointResponse) {

        var recordingRawData = recordingEndPointResponse[0];
        var blankRawData = blankEndPointResponse[0];

        //  2. prepare data in the format to be feeded to the visualisation library.
        var formattedData = prepareDataForGoogleChartTimeline(recordingRawData, endpoint);

        // console.log("formattedData is.......");
        // console.log(formattedData);

        //  2.1 filter out recordingEntries and processingEntries
        var startStopEntries = recordingRawData.filter(function(entry) {
            return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
        });

        //  2.2 sort these according to their timestamp (asc)
        startStopEntries.sort( (r1, r2) => {
            if (r1.timestamp < r2.timestamp) return -1;
            if (r1.timestamp > r2.timestamp) return 1;
            return 0;
        });

        //  2.3 filter the processing entries
        var processingEntries = formattedData.filter(function(dataTableEntry) {
            return dataTableEntry[dataTableEnum.category] == 'Processing';
        });

        // console.log("processingEntries are.........");
        // console.log(processingEntries);

        //  2.4 create a mapping of clipNumber --> processingEntry
        var clipNoToProcessingEntry = makeClipNoToProcessingEntry(processingEntries);
        // console.log("clipNoToProcessingEntry is........");
        // console.log(clipNoToProcessingEntry);


        console.log("startStopEntries sorted are.........");
        console.log(startStopEntries);

        //  2.5 make recording slots
        var recordingSlots = createRecordingSlots(startStopEntries, endpoint);
        console.log("Recording Slots are......");
        console.log(recordingSlots);


        var dummyEntries = getDummyEntries(recordingSlots, clipNoToProcessingEntry, endpoint);

        console.log("dummyEntries are.......");
        console.log(dummyEntries);


        //  3. If its today's date, then add current recordings
        var date = endpoint.searchParams.get('date');
        var device_id = endpoint.searchParams.get('device_id');
        // var currentRecordingEntries = [];
        // var today = yyyy_mm_dd(new Date());
        
        // if (date == today) {
        //     currentRecordingEntries = getCurrentRecordingEntries(formattedData);
        // }

        // // currentRecordingEntries = getCurrentRecordingEntries(formattedData);

        // var totalFormattedData = formattedData.concat(currentRecordingEntries);

        var totalFormattedData = formattedData.concat(dummyEntries);

        console.log("totalFormattedData is ....");
        console.log(totalFormattedData);

        //  3. create dataTable object
        var dataTable = initializeDataTable();

        
        //  4. add the data to the dataTable object
        dataTable.addRows(totalFormattedData);

        
        //  5. define options.
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
        globalDataTable[index] = dataTable;

        
        //  8. update the summary table : 
        //  NOTE :--> this takes formattedData and not totalFormattedData.
        // updateSummaryTable(formattedData, endpoint);
        updateSummaryTable(totalFormattedData, blankRawData, endpoint);

        //  9. add total blank minutes
        updateTotalBlankMinutes(recordingRawData, blankRawData, endpoint);

        // //  10. create entries in report (if its not today's date and device_id = 'a' {either one will do.})
        // if (date != yyyy_mm_dd(new Date()) && device_id == 'a') {
        //     generateDailyReport(filterRecordingTrackingEndPoint, filterRecordingTrackingRawData, recordingSlots);
        // }

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

function getBaseEndPoint() {

    //  Get the REST API endpoint to hit from current URL.
    var baseEndPoint = new URL(document.URL.replace('graph_ui', 'api'));
  
    //  If no date passed, add today's date
    if (!baseEndPoint.searchParams.get('date')) {
        baseEndPoint.searchParams.set('date', yyyy_mm_dd(new Date()));
    }

    //  Remove search parameters other than date.
    var parameters = Array.from(baseEndPoint.searchParams.keys()).filter(x => x != 'date');
    for (var i = 0; i < parameters.length; i++) {
        baseEndPoint.searchParams.delete(parameters[i]);
    }
    // console.log("baseEndPoint is :-> " + baseEndPoint.href);
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
        var aID = document.getElementById('a_' + channelValues[i] + '_blank');
        var specificURLA = new URL(baseURL.href);
        specificURLA.searchParams.set('scroll_to', '#a_' + channelValues[i] + "_blank");
        aID.setAttribute("href", specificURLA.href);

        //  device_id = 'b'
        //  get the corresponding anchor tag and set its href to the specific URL.
        var bID = document.getElementById('b_' + channelValues[i] + '_blank');
        var specificURLB = new URL(baseURL.href);
        specificURLB.searchParams.set('scroll_to', '#b_' + channelValues[i] + "_blank");
        bID.setAttribute("href", specificURLB.href);
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
    setSummaryColorLabels();

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

    //  patch: link to blankFrames UI
    linkToBlankFramesUI();

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
            google.visualization.events.addListener(timelines[i], 'select', function() {
                selectHandler(timelines[i], i);
            });
        
        })(i);
    }

    //  4. populate charts with periodic refreshing
    for (var i = 0; i < timelines.length; i++) {
        populateTimeline(timelines[i], specificEndPoints[i], i);

        //  if date is TODAY, then refresh every 5mins.
        if (baseEndPoint.searchParams.get('date') == yyyy_mm_dd(new Date())) {
            // console.log("refreshing every 5mins");
            setInterval(populateTimeline, 300000, timelines[i], specificEndPoints[i], i);
        }
        else {
            // console.log("NOT refreshing every 5mins");
        }
    }
});
