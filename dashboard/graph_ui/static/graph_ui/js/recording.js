let globalDataTable = {};

let stageToColor = {
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

let summaryStatusEnum  = Object.freeze({
    "ok"    :   1, 
    "empty"   :   2, 
    "error" :   3,
    "inprogress":   4,
    "blank" : 5
});

// Ref:- https://stackoverflow.com/questions/21346967/using-value-of-enum-as-key-in-another-enum-in-javascript
let summaryStatusToGraphic = {
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

    let highestStageNumberEntries = [rawData[0]];
    for(let i = 1; i < rawData.length; i++) {

        if (rawData[i]['stage_message'] == "Stop Recording" || rawData[i]['stage_message'] == "Start Recording") {
            highestStageNumberEntries.push(rawData[i]);
        }
        else {
            let lastIndex = highestStageNumberEntries.length - 1;
            if (highestStageNumberEntries[lastIndex]['request_id'] != rawData[i]['request_id']) {
                highestStageNumberEntries.push(rawData[i]);
            }
        }
    }
    return highestStageNumberEntries;
}

function prepareDataForGoogleChartTimeline(rawData, endpoint) {

    let date = endpoint.searchParams.get('date');
    let startDate = new Date(date + " 00:00:00");
    
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    if (!rawData || rawData.length == 0) {
        return [['Empty', '', 'No recordings available', stageToColor['empty'], startDate, endDate]];
    }

    //  1. for each request_id, get single entry having the maximum stage_number
    let highestStageNumberEntries = getHighestStageNumberEntries(rawData);    

    let dataTableContents = [];
    // console.log("Highest stage number entries are :-");
    // console.log(highestStageNumberEntries);
    // console.log("");

    for(let i = 0; i < highestStageNumberEntries.length; i++) {
        let entry = highestStageNumberEntries[i];
        
        let category;
        let label;
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;
        
        let safeTyMargin = 2;

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

            let entryTime = new Date(entry['timestamp']);
            let now = new Date();
            let hoursElapsed = (now.valueOf() - entryTime.valueOf()) / (1000 * 60 * 60);

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
            
            let startTimeString = hh_mm_ss(startTimeTimeline);
            tooltip = entry['stage_message'] + ' ' + startTimeString;
            
            // console.log("Clipnumber for start/stop entries is " + entry['clip_number']);
        }
        else {

            category = 'Processing';

            times = dateTimeFromProcessingRequestID(entry['request_id']);
            
            let startTime = times['start_time'];
            startTimeTimeline = new Date(startTime);
            startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);
            
            let endTime = times['end_time'];
            endTimeTimeline = new Date(endTime);
            endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);

            let startTimeString = hh_mm_ss(startTime);
            let endTimeString = hh_mm_ss(endTime);
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

function updateSummaryTable(formattedData, blankRawData, endpoint) {
    
    //  create a colorToStage mapping
    let colorToStage = reverseJsonMapper(stageToColor);

    //  check status
    let status;
    if (!blankRawData || blankRawData.length == 0) {
        status = summaryStatusEnum.ok;
    }
    else {
        status = summaryStatusEnum.blank;
    }

    for(let i = 0; i < formattedData.length; i++) {
        let color = formattedData[i][dataTableEnum.color];
        let stage = colorToStage[color];

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

    let innerHTML = summaryStatusToGraphic[status].innerHTML;
    let bgcolor = summaryStatusToGraphic[status].bgcolor;

    // select the DOM element corresponding to summaryBox of this channel.
    let deviceID = endpoint.searchParams.get('device_id');
    let channelValue = endpoint.searchParams.get('channel_values');
    let summaryBoxID = ['s', deviceID, channelValue].join("_");
    let summaryBox = document.getElementById(summaryBoxID);

    // fill the DOM Element with the details.
    summaryBox.innerHTML = innerHTML;
    summaryBox.setAttribute('bgcolor', bgcolor);
}

function updateTotalBlankMinutes(recordingRawData, blankRawData, endpoint) {

    //  get the HTML DOM element where this is going to happen
    let channelValue = endpoint.searchParams.get('channel_values');
    let deviceID = endpoint.searchParams.get('device_id');
    let divID = [deviceID, channelValue, "blank"].join("_");
    let DOMElement = document.getElementById(divID);
    
    if (!recordingRawData || recordingRawData.length == 0) {
        DOMElement.innerHTML = "No recordings available.";
        DOMElement.setAttribute('style', 'color: blue');
    }
    else if (!blankRawData || blankRawData.length == 0) {
        DOMElement.innerHTML = "No blank frames.";
        DOMElement.setAttribute('style', 'color: green');
    }
    else {
        let uniqueBlankRawData = removeDuplicateObjects(blankRawData);
        let totalBlankSeconds = 0;
        for(let i = 0; i < uniqueBlankRawData.length; i++) {
            let entry = uniqueBlankRawData[i];
            totalBlankSeconds += parseFloat(entry['invalid_frame_to']) - parseFloat(entry['invalid_frame_from']);
        }
        DOMElement.innerHTML = "" + (totalBlankSeconds / 60).toFixed(2) + " minutes of Blank Frames.";
        DOMElement.setAttribute('style', 'color: red');
    }
}

function makeClipNoToProcessingEntry(processingEntries) {
    
    let clipNoToProcessingEntry = {};
    
    for(let i = 0; i < processingEntries.length; i++) {
        let entry = processingEntries[i];
        let startTime = entry[dataTableEnum.startTime];

        let clipNumber = getClipNumber(hh_mm_ss(startTime));
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
    let date = endpoint.searchParams.get('date');
    let today = yyyy_mm_dd(new Date());

    let recordingSlots = [];

    let j = 0;
    for(let i = 0; i < startStopEntries.length; ) {
        
        let entry = {};
        let startRecordingDateTime;
        let stopRecordingDateTime;

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
    
    let dummyEntries = [];
    let inputDate = endpoint.searchParams.get('date');

    let currentTime = new Date();

    //  loop over recording slots
    for(let i = 0; i < recordingSlots.length; i++) {
        
        //  1. convert the start and end times to their corresponding clipNumbers
        let startRecordingTime = recordingSlots[i]['startRecordingTime'];
        let stopRecordingTime = recordingSlots[i]['stopRecordingTime'];

        let startClipNumber = getClipNumber(hh_mm_ss(startRecordingTime));
        let stopClipNumber = getClipNumber(hh_mm_ss(stopRecordingTime));

        // console.log("startClipNumber is........ " + startClipNumber);

        let safeTyMargin = 2;

        //  2. loop through the clipNumbers
        for (let j = startClipNumber; j <= stopClipNumber; j++) {
            
            //  3. check if entry corresponding to that clipNumber is present in the mapping - clipNoToProcessingEntry
            if (!clipNoToProcessingEntry[j]) {
            
                //  4. if not, create a dummy entry.
                let [startTime, endTime] = clipNoToInterval(inputDate, j);
                
                if (j == startClipNumber) {
                    startTime = startRecordingTime;
                }

                if (j == stopClipNumber) {
                    endTime = stopRecordingTime;
                }
                
                let startTimeString = hh_mm_ss(startTime);
                let endTimeString = hh_mm_ss(endTime);

                let category = 'Processing';

                let stageMessage = 'Now Recording';
                let hoursElapsed = (currentTime - startTime) / (60 * 60 * 1000);
                
                if (hoursElapsed > 1) {
                    stageMessage = 'Failed';
                }

                let label = stageMessage;
                let tooltip = stageMessage + " - " + startTimeString + " - " + endTimeString;
                let color = stageToColor[stageMessage];
                
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
    let recordingEndPoint = new URL(endpoint.href);

    //  this one has bug
    //  recording.athenasowl.tv/graph_ui/recording?date=... --> blank.athenasowl.tv/graph_ui/blank?date=...
    //  let blankEndPoint = new URL(endpoint.href.replace('recording', 'blank'));
    
    //  2. get the endpoint for invalid_frame_tracking_table
    //  creating an element with capability to extract protocol, host, path, etc...
    let url = document.createElement('a');
    url.href = endpoint.href;
    let protocol = url.protocol;
    let host = url.host;
    let path = url.pathname.replace('recording', 'blank');
    let searchParams = url.search;
    let blankEndPoint = new URL(protocol + "//" + host + path + searchParams);
    // console.log("blankEndPoint is .... " + blankEndPoint.href);

    //  3. get the endpoint for filter_recording_tracking_table
    url = document.createElement('a');
    url.href = endpoint.href;
    protocol = url.protocol;
    host = url.host;
    path = url.pathname.replace('recording', 'filter_recording_tracking');
    searchParams = url.search;
    let filterRecordingTrackingEndPoint = new URL(protocol + "//" + host + path + searchParams);
    filterRecordingTrackingEndPoint.searchParams.delete("device_id");

    // console.log("filterRecordingTrackingEndPoint is .... " + filterRecordingTrackingEndPoint.href);

    $.when(

        //  1. get data from recordingEndPoint
        $.get(recordingEndPoint),

        //  2. get data from blankEndPoint
        $.get(blankEndPoint)

    ).then(function(recordingEndPointResponse, blankEndPointResponse) {

        let recordingRawData = recordingEndPointResponse[0];
        let blankRawData = blankEndPointResponse[0];

        //  2. prepare data in the format to be feeded to the visualisation library.
        let formattedData = prepareDataForGoogleChartTimeline(recordingRawData, endpoint);

        // console.log("formattedData is.......");
        // console.log(formattedData);

        //  2.1 filter out recordingEntries and processingEntries
        let startStopEntries = recordingRawData.filter(function(entry) {
            return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
        });

        //  2.2 sort these according to their timestamp (asc)
        startStopEntries.sort( (r1, r2) => {
            if (r1.timestamp < r2.timestamp) return -1;
            if (r1.timestamp > r2.timestamp) return 1;
            return 0;
        });

        //  2.3 filter the processing entries
        let processingEntries = formattedData.filter(function(dataTableEntry) {
            return dataTableEntry[dataTableEnum.category] == 'Processing';
        });

        // console.log("processingEntries are.........");
        // console.log(processingEntries);

        //  2.4 create a mapping of clipNumber --> processingEntry
        let clipNoToProcessingEntry = makeClipNoToProcessingEntry(processingEntries);
        // console.log("clipNoToProcessingEntry is........");
        // console.log(clipNoToProcessingEntry);


        console.log("startStopEntries sorted are.........");
        console.log(startStopEntries);

        //  2.5 make recording slots
        let recordingSlots = createRecordingSlots(startStopEntries, endpoint);
        console.log("Recording Slots are......");
        console.log(recordingSlots);


        let dummyEntries = getDummyEntries(recordingSlots, clipNoToProcessingEntry, endpoint);

        console.log("dummyEntries are.......");
        console.log(dummyEntries);


        //  3. If its today's date, then add current recordings
        let date = endpoint.searchParams.get('date');
        let device_id = endpoint.searchParams.get('device_id');
        // let currentRecordingEntries = [];
        // let today = yyyy_mm_dd(new Date());
        
        // if (date == today) {
        //     currentRecordingEntries = getCurrentRecordingEntries(formattedData);
        // }

        // // currentRecordingEntries = getCurrentRecordingEntries(formattedData);

        // let totalFormattedData = formattedData.concat(currentRecordingEntries);

        let totalFormattedData = formattedData.concat(dummyEntries);

        console.log("totalFormattedData is ....");
        console.log(totalFormattedData);

        //  3. create dataTable object
        let dataTable = initializeDataTable();

        
        //  4. add the data to the dataTable object
        dataTable.addRows(totalFormattedData);

        
        //  5. define options.
        let startDate = new Date(date + " 00:00:00");
        
        let endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        let options = {
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
    let deviceID = endpoint.searchParams.get('device_id');
    let channelValue = endpoint.searchParams.get('channel_values');
    
    let divID = deviceID + "_" + channelValue;
    let container = document.getElementById(divID);
    return new google.visualization.Timeline(container);
}

function selectHandler(timeline, index) {

    let selectedDataTable = globalDataTable[index];
    let selection = timeline.getSelection()[0];
    let rowNo = selection.row;
    let label = selectedDataTable.getValue(rowNo, dataTableEnum.label);
    
    let labelJSON;
    
    //  if label isn't a JSON dump, then simply skip.
    try {
        labelJSON = JSON.parse(label);
    }
    catch(err) {
        return;
    }

    //  a. this was for on-click: table-view redirect
    let GETparams = labelJSON;
    let redirectURL = new URL(window.location.origin + "/ui/recording_graph_ui_redirect");

    for (key in GETparams) {
        redirectURL.searchParams.set(key, GETparams[key]);
    }

    // //  b. this is for on-click: graph_view redirect
    // let redirectURL = new URL(labelJSON['video_path'].replace("gs://", "https://storage.cloud.google.com/"));
    // console.log(redirectURL.href);


    window.open(redirectURL);
}

function setTimelineColorLabels() {
    let table = document.getElementById("timeline-color-labels");
    let trElement = table.childNodes[1].childNodes[1];

    for (key in stageToColor) {
        if (stageToColor.hasOwnProperty(key)) {
            
            let stage = document.createElement("th");
            stage.innerText = key;

            let color = document.createElement("th");
            color.setAttribute("bgcolor", stageToColor[key]);

            trElement.appendChild(color);
            trElement.appendChild(stage);
        }
    }
}

function setSummaryColorLabels() {
    let table = document.getElementById("summary-color-labels");
    let trElement = table.childNodes[1].childNodes[1];

    let summaryReverseEnum = reverseJsonMapper(summaryStatusEnum)

    for (key in summaryStatusToGraphic) {
        if (summaryStatusToGraphic.hasOwnProperty(key)) {
            
            let stage = document.createElement("th");
            stage.innerText = summaryReverseEnum[key];

            let color = document.createElement("th");
            color.setAttribute("bgcolor", summaryStatusToGraphic[key].bgcolor);
            color.innerHTML = summaryStatusToGraphic[key].innerHTML;

            trElement.appendChild(color);
            trElement.appendChild(stage);
        }
    }
}

function attachSummaryToTimeline() {
    
    for(let i = 0; i < channelValues.length; i++) {

        //  self invoking function to make a local scope for the index value which'll be used during callback.
        (function(i){

            let summaryBoxIDA = "#s_a_" + channelValues[i];
            let timelineIDA = "#a_" + channelValues[i] + "_blank";
    
            $(summaryBoxIDA).click(function() {
                $('html,body').animate({
                    scrollTop: $(timelineIDA).offset().top},
                    'slow');
            });
    
            let summaryBoxIDB = "#s_b_" + channelValues[i];
            let timelineIDB = "#b_" + channelValues[i] + "_blank";
    
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
    //  let baseURL = new URL(document.URL.replace('recording', 'blank'));

    //  new logic
    let protocol = window.location.protocol;
    let host = window.location.host;
    let path = window.location.pathname.replace('recording', 'blank');
    let searchParams = window.location.search;

    let baseURL = new URL(protocol + "//" + host + path + searchParams);

    //  loop for generating specific URLs
    for(let i = 0; i < channelValues.length; i++) {
        //  device_id = 'a'
        //  get the corresponding anchor tag and set its href to the specific URL.
        let aID = document.getElementById('a_' + channelValues[i] + '_blank');
        let specificURLA = new URL(baseURL.href);
        specificURLA.searchParams.set('scroll_to', '#a_' + channelValues[i] + "_blank");
        aID.setAttribute("href", specificURLA.href);

        //  device_id = 'b'
        //  get the corresponding anchor tag and set its href to the specific URL.
        let bID = document.getElementById('b_' + channelValues[i] + '_blank');
        let specificURLB = new URL(baseURL.href);
        specificURLB.searchParams.set('scroll_to', '#b_' + channelValues[i] + "_blank");
        bID.setAttribute("href", specificURLB.href);
    }
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    let baseEndPoint = getBaseEndPoint(defaultDate = 'today');

    //  patch:  set the date in the datepicker
    setDateInDatePicker('date', baseEndPoint.searchParams.get('date'));

    //  patch:  add color labels to page top
    setTimelineColorLabels();

    //  patch:  add summaryColorLabels at top of summaryTable.
    setSummaryColorLabels();

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

    //  patch: link to blankFrames UI
    linkToBlankFramesUI();

    //  2. make specificEndPoints array
    let specificEndPoints = [];
    for (let i = 0; i < channelValues.length; i++) {
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {"device_id": 'a', 'channel_values': channelValues[i]}));
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {"device_id": 'b', 'channel_values': channelValues[i]}));
    }

    //  3. initialize timeline
    let timelines = [];
    for (let i = 0; i < specificEndPoints.length; i++) {
        //  self invoking function to make a local scope for the index value which'll be used during callback.
        (function(i){
            
            timelines.push(initializeTimeline(specificEndPoints[i]));
            google.visualization.events.addListener(timelines[i], 'select', function() {
                selectHandler(timelines[i], i);
            });
        
        })(i);
    }

    //  4. populate charts with periodic refreshing
    for (let i = 0; i < timelines.length; i++) {
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
