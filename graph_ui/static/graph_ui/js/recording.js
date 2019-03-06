google.charts.load('46', {'packages':['timeline']});

var globalDataTable = {};

var globalStore = {};

var stageToColor = {
    "Start Recording":  'green',
    "Clipping Started":  'yellow',
    "Clipping Done":  'orange',
    "Uploading start":  'brown',
    "Uploading done":  'blue',
    "Stop Recording":  'black',
    'blank':    'grey',
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
        return [['Recording', '', 'No recordings available', stageToColor['blank'], startDate, endDate]];
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

        // label = entry['request_id'] + ":" + entry['device_id'];

        label = '{"request_id": "' + entry['request_id'] + '", "device_id": "' + entry['device_id'] +'"}';
        // console.log("Label is " + label);

        
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

        dataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
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
    "blank"   :   2, 
    "error" :   3,
    "inprogress":   4
});

// Ref:- https://stackoverflow.com/questions/21346967/using-value-of-enum-as-key-in-another-enum-in-javascript
var summaryStatusToGraphic = {
    [summaryStatusEnum.ok] : {
                            "bgcolor" : "lightgreen",
                            "innerHTML" : "&#10004;",
                            },
    [summaryStatusEnum.blank] : {
                            "bgcolor" : "lightgrey",
                            "innerHTML" : "&#10067;",
                            },
    [summaryStatusEnum.error] : {
                            "bgcolor" : "red",
                            "innerHTML" : "&#10008;",
                            },
    [summaryStatusEnum.inprogress] : {
                            "bgcolor" : "lightblue",
                            "innerHTML" : "&#10017;",
                            }
};


function updateSummaryTable(formattedData, endpoint) {
    
    //  create a colorToStage mapping
    var colorToStage = reverseJsonMapper(stageToColor);

    //  check status
    
    var status = summaryStatusEnum.ok;

    for(var i = 0; i < formattedData.length; i++) {
        var color = formattedData[i][dataTableEnum.color];
        var stage = colorToStage[color];

        if (stage == 'blank') {
            status = summaryStatusEnum.blank;
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

    //  get the last recording & processing entries.
    // var lastRecordingEntry = null;
    // var lastProcessingEntry = null;
    // for (var i = 0; i < formattedData.length; i++) {
    //     var entry = formattedData[i];
    //     //  if entry is of category Recording and its the first of this kind.
    //     if (!lastRecordingEntry && entry[dataTableEnum.category] == "Recording") {
    //         lastRecordingEntry = entry;
    //     }
    //     else if (!lastProcessingEntry && entry[dataTableEnum.category] == "Processing") {
    //         lastProcessingEntry = entry;
    //     }

    //     if (lastRecordingEntry && lastProcessingEntry) {
    //         break;
    //     }
    // }
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

    // //  if no recording entry found
    // if (!lastRecordingEntry) {
    //     return [];
    // }

    //  if no startRecordingEntry found
    if (!lastStartRecordingEntry) {
        return [];
    }

    // //  check whether last entry is start / stop recording
    // var lastRecordingEntryColor = lastRecordingEntry[dataTableEnum.color];
    // var lastRecordingEntryStage = colorToStage[lastRecordingEntryColor];

    // //  IF LAST ENTRY IS "STOP RECORDING"
    // if (lastRecordingEntryStage == "Stop Recording") {
    //     return [];
    // }

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

    // //  2. find clip number corresponding to the latest start recording 
    // var lastRecordingClipNumber = getClipNumber(hh_mm_ss(lastRecordingEntry[dataTableEnum.startTime]));

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
    /*
    TODO:
    1.  Complete the clipNoToInterval Function (DONE)
    2.  Add a manual start recording entry in today's date to database for a channel. (DONE)
    3.  Change color of entries beyond 1hr to dark red.
    4.  Check if it works.
    */
    return currentRecordingEntries;
     
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
        DOMElement.innerHTML = "" + Math.round(totalBlankSeconds / 60) + " minutes of Blank Frames.";
        DOMElement.setAttribute('style', 'color: red');
    }
}

function populateTimeline(timeline, endpoint, index) {
    
    //  1. get data via ajax call
    var recordingEndPoint = new URL(endpoint.href);
    var blankEndPoint = new URL(endpoint.href.replace('recording', 'blank'));


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

        console.log("blankRawData is.......");
        console.log(blankRawData);

        //  2. prepare data in the format to be feeded to the visualisation library.
        var formattedData = prepareDataForGoogleChartTimeline(recordingRawData, endpoint);
        
        //  3. If its today's date, then add current recordings
        var date = endpoint.searchParams.get('date');
        var currentRecordingEntries = [];
        var today = yyyy_mm_dd(new Date());
        
        if (date == today) {
            currentRecordingEntries = getCurrentRecordingEntries(formattedData);
        }

        // currentRecordingEntries = getCurrentRecordingEntries(formattedData);

        var totalFormattedData = formattedData.concat(currentRecordingEntries);

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
        updateSummaryTable(totalFormattedData, endpoint);

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

function selectHandler(timeline, index) {

    var selectedDataTable = globalDataTable[index];
    var selection = timeline.getSelection()[0];
    var rowNo = selection.row;
    var label = selectedDataTable.getValue(rowNo, 1);
    
    var GETparams;
    
    //  if label isn't a JSON dump, then simply skip.
    try {
        GETparams = JSON.parse(label);
    }
    catch(err) {
        return;
    }
    
    var redirectURL = new URL(window.location.origin + "/ui/recording_graph_ui_redirect");

    for (key in GETparams) {
        redirectURL.searchParams.set(key, GETparams[key]);
    }

    window.open(redirectURL);
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

function linkToBlankFramesUI() {
    
    //  get the current URL & change it to get the URL for blank UI
    var baseURL = new URL(document.URL.replace('recording', 'blank'));

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
    setColorLabels();

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
        setInterval(populateTimeline, 300000, timelines[i], specificEndPoints[i], i);
    }
});