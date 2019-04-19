let globalDataTable = {};

let stageToColor = {
    "Start Recording":  'green',
    "Uploading done":  'blue',
    "Stop Recording":  'black',
    'empty':    'grey'
}

const timelineStagesEnum  = Object.freeze({
    "Start Recording"    :   1, 
    "Uploading done"     :   2, 
    "Stop Recording"     :   3,
    "empty"              :   4
});

// Ref:- https://stackoverflow.com/questions/21346967/using-value-of-enum-as-key-in-another-enum-in-javascript
const timelineStagesToGraphic = Object.freeze({
    [timelineStagesEnum['Start Recording']] : {
                            "bgcolor" : "green",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['Uploading done']] : {
                            "bgcolor" : "blue",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['Stop Recording']] : {
                            "bgcolor" : "black",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['empty']] : {
                            "bgcolor" : "grey",
                            "innerHTML" : "",
                            }
});

function prepareStartStopEntries(startStopRawData, endpoint) {

    let startStopDataTableContents = [];

    for(let i = 0; i < startStopRawData.length; i++) {
        let entry = startStopRawData[i];

        let category;
        let label;
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;
        
        let safeTyMargin = 2;

        category = 'Recording';
        label = '';
        color = stageToColor[entry['stage_message']];
            
        startTimeTimeline = new Date(entry['timestamp']);

        endTimeTimeline = new Date(entry['timestamp']);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
        
        let startTimeString = hh_mm_ss(startTimeTimeline);
        tooltip = entry['stage_message'] + ' ' + startTimeString;
            
        startStopDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    }

    //  3. return it.
    return startStopDataTableContents;
}

function prepareProcessingEntries(filterRawData, endpoint) {
    
    let processingDataTableContents = [];

    for(let i = 0; i < filterRawData.length; i++) {
        let entry = filterRawData[i];
        
        let category;                                       //  used to 
        let label;                                          //  used for storing hidden data for each entry to be used later.
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;
        
        let safeTyMargin = 2;

        category = 'Processing';
        label = '';
        color = 'blue';

        times = dateTimeFromProcessingRequestID(entry['request_id']);
        
        let startTime = times['start_time'];
        startTimeTimeline = new Date(startTime);
        startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);
        
        let endTime = times['end_time'];
        endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);


        endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + entry['clip_duration']);

        endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);

        let startTimeString = hh_mm_ss(startTime);
        let endTimeString = hh_mm_ss(endTime);
        
        tooltip = entry['device_id'] + ' ' + startTimeString + ' - ' + endTimeString;

        if (startTimeTimeline < endTimeTimeline) {
            processingDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
        }
    }

    //  3. return it.
    return processingDataTableContents;
}

function prepareDataForGoogleChartTimeline(recordingRawData, filterRawData, endpoint) {

    let date = endpoint.searchParams.get('date');
    let startDate = new Date(date + " 00:00:00");
    
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    //  extract startStopRawData for device_id = 'a'
    let startStopRawData = recordingRawData.filter(function(entry) {
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

    let startStopDataTableContents = prepareStartStopEntries(startStopRawData, endpoint);
    
    let processingDataTableContents = prepareProcessingEntries(filterRawData, endpoint);

    let dataTableContents = startStopDataTableContents.concat(processingDataTableContents);

    return dataTableContents;
}

function updateSummaryTable(formattedData, blankRawData, endpoint) {
    
    //  create a colorToStage mapping
    let colorToStage = reverseJsonMapper(stageToColor);

    //  check status
    let status;
    if (!blankRawData || blankRawData.length == 0) {
        status = summaryStagesEnum.ok;
    }
    else {
        status = summaryStagesEnum.blank;
    }

    for(let i = 0; i < formattedData.length; i++) {
        let color = formattedData[i][dataTableEnum.color];
        let stage = colorToStage[color];

        if (stage == 'empty') {
            status = summaryStagesEnum.empty;
            break;
        }
        else if (stage == "Start Recording" || stage == "Stop Recording") {
            continue;
        }
        else if (stage == 'Failed') {
            status = summaryStagesEnum.error;
            break;
        }
        else if (stage != 'Uploading done') {
            status = summaryStagesEnum.inprogress;
        }
        // else if (stage == 'Now Recording') {
        //     console.log("Now Recording Hitted!!");
        //     status = summaryStagesEnum.inprogress;
        // }
    }

    let innerHTML = summaryStagesToGraphic[status].innerHTML;
    let bgcolor = summaryStagesToGraphic[status].bgcolor;

    // select the DOM element corresponding to summaryBox of this channel.
    let deviceID = endpoint.searchParams.get('device_id');
    let channelValue = endpoint.searchParams.get('channel_values');
    let summaryBoxID = ['s', deviceID, channelValue].join("_");
    let summaryBox = document.getElementById(summaryBoxID);

    // fill the DOM Element with the details.
    summaryBox.innerHTML = innerHTML;
    summaryBox.setAttribute('bgcolor', bgcolor);
}

function getCurrentRecordingEntries(formattedData) {

    // Ref:- https://stackoverflow.com/questions/7486085/copy-array-by-value
    formattedData = formattedData.slice();

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

    let colorToStage = reverseJsonMapper(stageToColor);

    let lastRecordingEntry = null;
    let lastStartRecordingEntry = null;
    let lastProcessingEntry = null;
    for (let i = 0; i < formattedData.length; i++) {

        let entry = formattedData[i];
        
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
    let currentRecordingEntries = [];

    //  1. get the latest clip number out of the formattedData entries
    let lastProcessingClipNumber = 0;
    if (!lastProcessingEntry) {
        lastProcessingClipNumber = 0;
    }
    else {
        lastProcessingClipNumber = getClipNumber(hh_mm_ss(lastProcessingEntry[dataTableEnum.startTime])) + 1;
    }

    //  2. find clip number corresponding to the latest start recording 
    let lastStartRecordingClipNumber = getClipNumber(hh_mm_ss(lastStartRecordingEntry[dataTableEnum.startTime]));

    //  3. take maximum of the above two
    let startingClipNumber = Math.max(lastProcessingClipNumber, lastStartRecordingClipNumber);

    //  4. find clip number corresponding to current time
    let currentTime = new Date();
    let currentTimeClipNumber = getClipNumber(hh_mm_ss(currentTime));

    //  5. get the endingClipNumber
    let endingClipNumber;

    //  a. if no stopRecording entry in the end
    if (lastRecordingEntry == lastStartRecordingEntry) {
        endingClipNumber = currentTimeClipNumber;
    }
    //  b. if stopRecording entry in the end
    else {
        endingClipNumber = getClipNumber(hh_mm_ss(lastRecordingEntry[dataTableEnum.startTime])) - 1;
    }

    //  6. make entries for the missing clip numbers
    let safeTyMargin = 2;
    for (let i = startingClipNumber; i <= endingClipNumber; i++) {
        
        let stageMessage = 'Now Recording';
        //  category
        let category = 'Processing';

        //  label
        let label = stageMessage;

        let [startTime, endTime] = clipNoToInterval(yyyy_mm_dd(new Date()), i);

        let startTimeString = hh_mm_ss(startTime);
        let endTimeString = hh_mm_ss(endTime);
        
        //  startTimeTimeline
        let startTimeTimeline = new Date(startTime);
        startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);

        //  endTimeTimeline
        let endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);
        
        //  color
        //  see if difference between current_time and the startTime of this entry is more than 1hr, then make this "Failure", else use original stageMessage
        let color;
        let hoursElapsed = (currentTime - startTime) / (60 * 60 * 1000)
        
        if (hoursElapsed > 1) {
            stageMessage = 'Failed';
        }

        color = stageToColor[stageMessage];

        //  tooltip
        let tooltip = stageMessage + ' ' + startTimeString + ' - ' + endTimeString;
        
        //  add entry
        currentRecordingEntries.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    }
    return currentRecordingEntries;
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
        DOMElement.innerHTML = "" + Math.round(totalBlankSeconds / 60) + " minutes of Blank Frames.";
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
                // console.log("clipNumber " + j + " is missing.");

                //  4. if not, create a dummy entry.
                let [startTime, endTime] = clipNoToInterval(inputDate, j);
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

                dummyEntries.push([category, label, tooltip, color, startTime, endTime]);
            }
        }

        // console.log("stopClipNumber is........ " + stopClipNumber);
    }

    return dummyEntries;
}

function populateTimeline(timeline, endpoint, index) {
    
    let filterEndPoint = new URL(endpoint.href);

    //  1. making corresponding endpoint for recording table.
    let recordingEndPoint = new URL(endpoint.href);

    let url = document.createElement('a');
    url.href = endpoint.href;
    let protocol = url.protocol;
    let host = url.host;
    let path = '/api/recording';
    let searchParams = url.search;
    recordingEndPoint = new URL(protocol + "//" + host + path + searchParams);
    // console.log("recordingEndPoint is .... " + recordingEndPoint.href);

    $.when(

        //  1. get data from endpoint
        $.get(filterEndPoint),

        //  1. get data from recordingEndPoint
        $.get(recordingEndPoint)

    ).then(function(filterEndPointResponse, recordingEndPointResponse) {
        
        let filterRawData = filterEndPointResponse[0];
        let recordingRawData = recordingEndPointResponse[0];

        console.log("filterRawData is.......");
        console.log(filterRawData);

        console.log("recordingRawData is.......");
        console.log(recordingRawData);

        //  2. prepare data in the format to be feeded to the visualisation library.
        let formattedData = prepareDataForGoogleChartTimeline(recordingRawData, filterRawData, endpoint);

        console.log("formattedData is.......");
        console.log(formattedData);

        // //  2.1 filter out recordingEntries and processingEntries
        // let startStopEntries = recordingRawData.filter(function(entry) {
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
        // let processingEntries = formattedData.filter(function(dataTableEntry) {
        //     return dataTableEntry[dataTableEnum.category] == 'Processing';
        // });

        // console.log("processingEntries are.........");
        // console.log(processingEntries);

        // //  2.4 create a mapping of clipNumber --> processingEntry
        // let clipNoToProcessingEntry = makeClipNoToProcessingEntry(processingEntries);
        // console.log("clipNoToProcessingEntry is........");
        // console.log(clipNoToProcessingEntry);

        // //  2.5 make recording slots
        // let recordingSlots = createRecordingSlots(startStopEntries, endpoint);
        // console.log("Recording Slots are......");
        // console.log(recordingSlots);


        // let dummyEntries = getDummyEntries(recordingSlots, clipNoToProcessingEntry, endpoint);
        // console.log("dummyEntries are.......");
        // console.log(dummyEntries);


        // //  3. If its today's date, then add current recordings
        let date = endpoint.searchParams.get('date');
        // let device_id = endpoint.searchParams.get('device_id');
        // // let currentRecordingEntries = [];
        // // let today = yyyy_mm_dd(new Date());
        
        // // if (date == today) {
        // //     currentRecordingEntries = getCurrentRecordingEntries(formattedData);
        // // }

        // // // currentRecordingEntries = getCurrentRecordingEntries(formattedData);

        // // let totalFormattedData = formattedData.concat(currentRecordingEntries);

        // let totalFormattedData = formattedData.concat(dummyEntries);

        // console.log("totalFormattedData is ....");
        // console.log(totalFormattedData);

        let totalFormattedData = formattedData;

        //  3. create dataTable object
        let dataTable = initializeDataTable();

        
        //  4. add the data to the dataTable object
        dataTable.addRows(totalFormattedData);

        
        //  5. define options.
        let startDate = new Date(date + " 00:00:00");
        
        let endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        let options = {
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
    let channelValue = endpoint.searchParams.get('channel_values');
    
    let divID = "filter_" + channelValue;
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


function attachSummaryToTimeline() {
    
    for(let i = 0; i < channelValues.length; i++) {

        //  self invoking function to make a local scope for the index value which'll be used during callback.
        (function(i){

            let summaryBoxIDA = "#s_filter_" + channelValues[i];
            let timelineIDA = "#filter_" + channelValues[i] + "_blank";
    
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
        let aID = document.getElementById(channelValues[i] + '_blank');
        let specificURL = new URL(baseURL.href);
        specificURL.searchParams.set('scroll_to', '#' + channelValues[i] + "_blank");
        aID.setAttribute("href", specificURL.href);
    }
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    let baseEndPoint = getBaseEndPoint(defaultDate = 'yesterday');

    //  patch:  set the date in the datepicker
    setDateInDatePicker('date', baseEndPoint.searchParams.get('date'));

    //  patch:  add color labels to page top
    setColorLabels("#timeline-color-labels", timelineStagesEnum, timelineStagesToGraphic);

    //  patch:  add summaryColorLabels at top of summaryTable.
    // setSummaryColorLabels();

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

    // //  patch: link to blankFrames UI <NOT_REQUIRED>
    // linkToBlankFramesUI();

    //  2. make specificEndPoints array
    let specificEndPoints = [];
    for (let i = 0; i < channelValues.length; i++) {
        specificEndPoints.push(addGETParameters(baseEndPoint.href, {'channel_values': channelValues[i]}));
    }

    //  3. initialize timeline
    let timelines = [];
    for (let i = 0; i < specificEndPoints.length; i++) {
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
    for (let i = 0; i < specificEndPoints.length; i++) {
        // console.log("specificEndpoint Number " + i + " is " + specificEndPoints[i].href);
    }

    //  4. populate charts with periodic refreshing
    for (let i = 0; i < timelines.length; i++) {
        populateTimeline(timelines[i], specificEndPoints[i], i);
        //  Since this isn't live tracking, no need to refresh every 5 mins. Manual refresh is enough.
    }
});