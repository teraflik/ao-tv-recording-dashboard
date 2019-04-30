let stageToColor = {
    "Start Recording":  'green',
    "Stop Recording":  'red',
    "Normal Frame": 'blue',
    "Blank Frame": 'brown',
    "Empty": "grey"
}

const timelineStagesEnum = Object.freeze({
    "Start Recording"           :   1,
    "Stop Recording"            :   2,
    "Normal Frame"              :   3,
    "Blank Frame"               :   4,
    "Empty"                     :   5,
    "Expected Start Recording"  :   6,
    "Expected Stop Recording"   :   7,
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
                                                },
    [timelineStagesEnum['Expected Start Recording']] : {
                                                    "bgcolor" : "pink",
                                                    "innerHTML" : "",
                                                },
    [timelineStagesEnum['Expected Stop Recording']]  : {
                                                    "bgcolor" : "violet",
                                                    "innerHTML" : "",
                                                    },
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

function prepareRecordingSlots(startStopEntries, blankDateRangeEntries, date) {
    
    //  extract date from endpoint and get today's date
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

const prepareBlankDataTableEntries = (recordingRawData, blankRawData, date) => {

    //  2. filter startStopRecordings from recordingRawData
    let startStopEntries = recordingRawData.filter(function(entry) {
        return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
    });

    // 4. sort startStopEntries according to timestamp (asc order)
    startStopEntries.sort( (r1, r2) => {
        if (r1.timestamp < r2.timestamp) return -1;
        if (r1.timestamp > r2.timestamp) return 1;
        return 0;
    });

    uniqueBlankRawData = removeDuplicateObjects(blankRawData);

    blankDateRangeEntries = createBlankDateRangeEntries(uniqueBlankRawData);

    //  8. sort blankDateRangeEntries in order of startTime. (asc)
    blankDateRangeEntries.sort( (r1, r2) => {
        if (r1.startTime < r2.startTime) return -1;
        if (r1.startTime > r2.startTime) return 1;
        return 0;
    });

    //  9. prepare recording slots

    let recordingSlots = prepareRecordingSlots(startStopEntries, blankDateRangeEntries, date);

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
    
    return blankDataTableContents;

}

const updateSummaryTable = (formattedData, blankRawData, params) => {
    
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
    let deviceID = params['device_id'];
    let channelValue = params['channel_values'];

    let summaryBoxID = ['s', deviceID, channelValue].join("_");
    let summaryBox = document.getElementById(summaryBoxID);

    // fill the DOM Element with the details.
    summaryBox.innerHTML = innerHTML;
    summaryBox.setAttribute('bgcolor', bgcolor);
}

const scrollToGivenID = () => {

    let currentURL = new URL(document.URL);
    let idToScroll = currentURL.searchParams.get('scroll_to');

    if (!idToScroll) {
        return;
    }

    $('html,body').animate({
        scrollTop: $(idToScroll).offset().top},
        'slow');
}

const selectHandler = (timeline, selectedDataTable) => {

    //  1. Find the particular dataTable row which was clicked.
    let rowNo = timeline.getSelection()[0].row;

    //  2. Extract its `label` attribute.
    let label = selectedDataTable.getValue(rowNo, dataTableEnum.label);

    //  3. ensure that its a valid JSON dumped string.
    let labelJSON;
    try {
        labelJSON = JSON.parse(label);
    }
    catch(err) {
        return;
    }
    
    //  4. this JSON is basically key-value pair of GET-Params to be added to the URL.
    let GETparams = labelJSON;

    //  5. get base recording_tracking API endpoint.
    let getVideoURLEndpoint = getBaseEndPoint(tableName = "RECORDING_TRACKING");

    getVideoURLEndpoint = addGETParameters(getVideoURLEndpoint, GETparams);

    $.get(getVideoURLEndpoint).then((data) => {
        let entry = data[0];
        let redirectURL = new URL(entry['clip_path'].replace("gs://", "https://storage.cloud.google.com/"));
        window.open(redirectURL);
    })

}

google.charts.setOnLoadCallback(() => {
    
    //  extract date from current URL.
    let date = getDefaultDate(document.URL);

    //  patch:  set the date in the datepicker
    setDateInDatePicker('#date', date);

    //  patch:  add color labels to page top
    setColorLabels("#timeline-color-labels", timelineStagesEnum, timelineStageToGraphic);

    //  patch:  add summaryColorLabels at top of summaryTable.
    setColorLabels("#summary-color-labels", summaryStagesEnum, summaryStagesToGraphic);

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

    //  specify the devices from which we need data from.
    let devices = ['a', 'b'];

    //  specify the tables from which each timeline would fetch data.
    let tables = ['RECORDING', 'INVALID_FRAME_TRACKING', 'RECORDING_GUIDE'];

    let processingMapping = [
        {"data_source_tables" : ["RECORDING_GUIDE"], "processing_method" : prepareRecordingGuideDataTableEntries},
        {"data_source_tables" : ["RECORDING"], "processing_method" : prepareStartStopDataTableEntries},
        {"data_source_tables" : ["RECORDING", "INVALID_FRAME_TRACKING"], "processing_method" : prepareBlankDataTableEntries},
    ];

    //  main loop
    channelValues.forEach((channelValue) => {
        devices.forEach((device) => { 

            //  a. set params dict.
            let params = {"date": date, "channel_values": channelValue, "device_id": device}; 

            //  b. initialize timeline
            let timelineQuerySelector = "#" + device + "_" + channelValue;
            let timeline = initializeTimeline(timelineQuerySelector);
 
            //  c. get data for the timeline.           
            let dataMappingPromise = getDataForTimeline(tables, params);

            //  d. 
            populateDevice(dataMappingPromise, timeline, params, processingMapping);
            
            //  e. refresh every 5 mins.
            setTimeout(populateDevice, 300000, dataMappingPromise, timeline, params, processingMapping);
        });
    });

    //  5. scroll to given ID if specified 2 secs after load completes
    setTimeout(scrollToGivenID, 2000);
});