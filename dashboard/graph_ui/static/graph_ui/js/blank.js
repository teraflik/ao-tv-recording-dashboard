let globalDataTable = {};

let stageToColor = {
    "Start Recording":  'green',
    "Stop Recording":  'red',
    "Normal Frame": 'blue',
    "Blank Frame": 'brown',
    "Empty": "grey"
}

const timelineStagesEnum = Object.freeze({
    "Start Recording"   :   1,
    "Stop Recording"    :   2,
    "Normal Frame"      :   3,
    "Blank Frame"       :   4,
    "Empty"             :   5
});

const timelineStageToGraphic = Object.freeze({
    [timelineStagesEnum["Start Recording"]] :  {
                                                    'bgcolor': 'green',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Stop Recording"]]  :  {
                                                    'bgcolor': 'red',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Normal Frame"]]    :  {
                                                    'bgcolor': 'blue',
                                                    'innerHTML': '',
                                                },  
    [timelineStagesEnum["Blank Frame"]]     :  {
                                                    'bgcolor': 'brown',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Empty"]]           :  {
                                                    'bgcolor': 'grey',
                                                    'innerHTML': '',
                                                }
});

const summaryStagesEnum  = Object.freeze({
    "ok"    :   1, 
    "blank" :   2,
    "empty"   :   3
});

// Ref:- https://stackoverflow.com/questions/21346967/using-value-of-enum-as-key-in-another-enum-in-javascript
const summaryStagesToGraphic = Object.freeze({
    [summaryStagesEnum.ok] : {
                            "bgcolor" : "lightgreen",
                            "innerHTML" : "&#10004;",
                            },
    [summaryStagesEnum.empty] : {
                            "bgcolor" : "lightgrey",
                            "innerHTML" : "NA",
                            },
    [summaryStagesEnum.blank] : {
                            "bgcolor" : "brown",
                            "innerHTML" : "&#10008;",
                            },
});

function createBlankDateRangeEntries(uniqueBlankRawData) {

    let blankDateRangeEntries = [];

    for(let i = 0; i < uniqueBlankRawData.length; i++) {
        entry = uniqueBlankRawData[i];

        let startTime = dateTimeFromProcessingRequestID(entry['request_id'])['start_time'];
        
        let fromMilliseconds = parseFloat(entry['invalid_frame_from']) * 1000;
        let toMilliseconds = parseFloat(entry['invalid_frame_to']) * 1000;

        let invalidFrameStartTime = new Date(startTime);
        invalidFrameStartTime.setMilliseconds(fromMilliseconds);

        let invalidFrameEndTime = new Date(startTime);
        invalidFrameEndTime.setMilliseconds(toMilliseconds);

        blankDateRangeEntries.push({"request_id": entry["request_id"], "device_id": entry["device_id"], "startTime": invalidFrameStartTime, "endTime": invalidFrameEndTime});
    }
    return blankDateRangeEntries;
}

function prepareRecordingSlots(startStopEntries, blankDateRangeEntries, endpoint) {
    
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
    
    console.log("Endpoint is :- " + endpoint.href);

    console.log("blankRawData is....");
    console.log(blankRawData);

    console.log("recordingRawData is....");
    console.log(recordingRawData);

    let date = endpoint.searchParams.get('date');
    let startDate = new Date(date + " 00:00:00");
    
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    //  1. if no recordingData, then return an empty grey entry
    if (!recordingRawData || recordingRawData.length == 0) {
        return [['Empty', '', 'No recordings available', stageToColor['Empty'], startDate, endDate]];
    }

    //  2. filter startStopRecordings from recordingRawData
    let startStopEntries = recordingRawData.filter(function(entry) {
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
    let dataTableContents = [];

    let recordingDataTableContents = [];
    for(let i = 0; i < startStopEntries.length; i++) {
        
        let entry = startStopEntries[i];
        
        //  dataTable fields
        let category;
        let label;
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;

        category = 'Recording';
        label = '';
        color = stageToColor[entry['stage_message']];

        startTimeTimeline = new Date(entry['timestamp']);

        endTimeTimeline = new Date(entry['timestamp']);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);

        let startTimeString = hh_mm_ss(startTimeTimeline);
        tooltip = entry['stage_message'] + ' ' + startTimeString;

        recordingDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    }

    dataTableContents = dataTableContents.concat(recordingDataTableContents);
    
    //  6. remove duplicates from blankRawData
    // console.log("blankRawData is....");
    // console.log(blankRawData);

    uniqueBlankRawData = removeDuplicateObjects(blankRawData);

    //  7. convert each entry of uniqueBlankRawData into blankDateRangeEntries
    // console.log("uniqueBlankRawData is....");
    // console.log(uniqueBlankRawData);

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

    let recordingSlots = prepareRecordingSlots(startStopEntries, blankDateRangeEntries, endpoint);

    console.log("recordingSlots is..........");
    console.log(recordingSlots);

    //  10. create dataTable entries of "Blank" category
    let category;
    let label;
    let tooltip;
    let color;
    let startTimeTimeline;
    let endTimeTimeline;

    category = 'Blank';
    label = '';

    let blankDataTableContents = [];
    for(let i = 0; i < recordingSlots.length; i++) {

        lastEndTime = recordingSlots[i]['startRecordingTime'];
        blankEntries = recordingSlots[i]['blankEntries'];
        stopRecordingTime = recordingSlots[i]['stopRecordingTime'];

        for(let j = 0; j < blankEntries.length; j++) {
            
            let currentStartTime = blankEntries[j]['startTime'];
            let currentEndTime = blankEntries[j]['endTime'];
            //  label for brownish blank slot in the timeline
            let blankLabel = '{"request_id": "' + blankEntries[j]['request_id'] + '", "device_id": "' + blankEntries[j]['device_id'] +'"}';

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
                blankDataTableContents.push([category, blankLabel, tooltip, color, startTimeTimeline, endTimeTimeline]);
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

function updateSummaryTable(formattedData, endpoint) {
    
    //  create a colorToStage mapping
    let colorToStage = reverseJsonMapper(stageToColor);

    //  check status
    
    let status = summaryStagesEnum.ok;

    for(let i = 0; i < formattedData.length; i++) {
        let color = formattedData[i][dataTableEnum.color];
        let stage = colorToStage[color];

        if (stage == 'Empty') {
            status = summaryStagesEnum.empty;
            break;
        }
        else if (stage == "Start Recording" || stage == "Stop Recording") {
            continue;
        }
        else if (stage == 'Blank Frame') {
            status = summaryStagesEnum.blank;
            break;
        }
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

function populateTimeline(timeline, endpoint, index) {

    let blankEndPoint = new URL(endpoint.href);
    let recordingEndPoint = new URL(endpoint.href.replace('blank', 'recording'));


    $.when(

        //  1. get data from recordingEndPoint
        getValidResponse(recordingEndPoint),

        //  2. get data from blankEndPoint
        getValidResponse(blankEndPoint)

    ).then(function(recordingRawData, blankRawData) {
        
        //  2. prepare data in the format to be feeded to the visualisation library.
        let formattedData = prepareDataForGoogleChartTimeline(recordingRawData, blankRawData, endpoint);

        //  3. create dataTable object
        let dataTable = initializeDataTable();

        //  4. add the data to the dataTable object
        dataTable.addRows(formattedData);

        //  5. define options.
        let date = endpoint.searchParams.get('date');
    
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
            avoidOverlappingGridLines: false,
            width: '100%',
            height: '105'
        };
        
        //  6. feed data to the timeline.
        timeline.draw(dataTable, options);

        //  7. updating the globalDataTable lookup
        globalDataTable[index] = dataTable;

        
        //  8. update the summary table : 
        updateSummaryTable(formattedData, endpoint);

        //  9. add total blank minutes
        updateTotalBlankMinutes(recordingRawData, blankRawData, endpoint);
    });
}

function scrollToGivenID() {
    let currentURL = new URL(document.URL);
    let idToScroll = currentURL.searchParams.get('scroll_to');

    if (!idToScroll) {
        return;
    }

    $('html,body').animate({
        scrollTop: $(idToScroll).offset().top},
        'slow');
}

function selectHandler(timeline, index) {

    let selectedDataTable = globalDataTable[index];
    let selection = timeline.getSelection()[0];
    let rowNo = selection.row;
    let label = selectedDataTable.getValue(rowNo, dataTableEnum.label);

    console.log("label of the clicked entry is ---> " + label);
    let labelJSON;
    
    //  if label isn't a JSON dump, then simply skip.
    try {
        labelJSON = JSON.parse(label);
    }
    catch(err) {
        return;
    }
    console.log("labelJSON is ....");
    console.log(labelJSON);
    //  a. this was for on-click: table-view redirect
    let GETparams = labelJSON;
    let getVideoURLEndpoint = new URL(window.location.origin + "/api/recording_tracking");

    for (key in GETparams) {
        getVideoURLEndpoint.searchParams.set(key, GETparams[key]);
    }

    $.ajax({
        type: 'GET',
        url: getVideoURLEndpoint,
        async: false,
        dataType: 'json',
        success: function(data){
                let entry = data[0];
                let redirectURL = new URL(entry['clip_path'].replace("gs://", "https://storage.cloud.google.com/"));
                console.log("redirectURL is .....");
                console.log(redirectURL.href);
                window.open(redirectURL);
            }
    });


    // //  b. this is for on-click: graph_view redirect
    // let redirectURL = new URL(labelJSON['video_path'].replace("gs://", "https://storage.cloud.google.com/"));
    // window.open(redirectURL);
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    let baseEndPoint = getBaseEndPoint(tableName = 'INVALID_FRAME_TRACKING');

    //  patch:  set the date in the datepicker
    setDateInDatePicker('#date', baseEndPoint.searchParams.get('date'));

    //  patch:  add color labels to page top
    setColorLabels("#timeline-color-labels", timelineStagesEnum, timelineStageToGraphic);

    //  patch:  add summaryColorLabels at top of summaryTable.
    setColorLabels("#summary-color-labels", timelineStagesEnum, timelineStageToGraphic);

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

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
            
            let timelineQuerySelector = "#" + specificEndPoints[i].searchParams.get('device_id') + "_" + specificEndPoints[i].searchParams.get('channel_values');
            timelines.push(initializeTimeline(timelineQuerySelector));

            google.visualization.events.addListener(timelines[i], 'select', function() {
                selectHandler(timelines[i], i);
            });
        
        })(i);
    }

    //  4. populate charts with periodic refreshing
    for (let i = 0; i < timelines.length; i++) {
        populateTimeline(timelines[i], specificEndPoints[i], i);
        setInterval(populateTimeline, 300000, timelines[i], specificEndPoints[i], i);
    }

    //  5. scroll to given ID if specified
    setTimeout(scrollToGivenID, 2000);
});