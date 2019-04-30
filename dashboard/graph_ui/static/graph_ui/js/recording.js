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

const timelineStagesEnum = Object.freeze({
    "Start Recording"           :   1,
    "Clipping Started"          :   2,
    "Clipping Done"             :   3,
    "Uploading start"           :   4,
    "Uploading done"            :   5,
    "Stop Recording"            :   6,
    "Empty"                     :   7,
    "Now Recording"             :   8,
    "Failed"                    :   9,
    "Expected Start Recording"  :   10,
    "Expected Stop Recording"   :   11,
});

const timelineStageToGraphic = Object.freeze({
    [timelineStagesEnum["Start Recording"]]   :  {
                                                    'bgcolor': 'green',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Clipping Started"]]  :  {
                                                    'bgcolor': 'yellow',
                                                    'innerHTML': '',
                                                },  
    [timelineStagesEnum["Clipping Done"]]     :  {
                                                    'bgcolor': 'orange',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Uploading start"]]   :  {
                                                    'bgcolor': 'brown',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Uploading done"]]    :  {
                                                    'bgcolor': 'blue',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Stop Recording"]]    :  {
                                                    'bgcolor': 'black',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Empty"]]             :  {
                                                    'bgcolor': 'grey',
                                                    'innerHTML': '',
                                                }, 
    [timelineStagesEnum["Now Recording"]]     :  {
                                                    'bgcolor': 'lightblue',
                                                    'innerHTML': '',
                                                },
    [timelineStagesEnum["Failed"]]            :  {
                                                    'bgcolor': 'red',
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
    "empty"   :   2, 
    "error" :   3,
    "inprogress":   4,
    "blank" : 5
});

const summaryStagesToGraphic = Object.freeze({
    [summaryStagesEnum['ok']] : {
                            "bgcolor" : "lightgreen",
                            "innerHTML" : "&#10004;",
                            },
    [summaryStagesEnum['empty']] : {
                            "bgcolor" : "lightgrey",
                            "innerHTML" : "NA",
                            },
    [summaryStagesEnum['error']] : {
                            "bgcolor" : "red",
                            "innerHTML" : "&#10008;",
                            },
    [summaryStagesEnum['inprogress']] : {
                            "bgcolor" : "lightblue",
                            "innerHTML" : "&#10017;",
                            },
    [summaryStagesEnum['blank']] : {
                            "bgcolor" : "brown",
                            "innerHTML" : "&#10004;",
                            },
});

const getHighestStageNumberEntries = (rawData) => {

    if (rawData.length == 0) {
        return [];
    }

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

const makeAvailableClipsMap = (processingRawData) => {

    let isClipAvailable = {};

    processingRawData.forEach((processingEntry) => {
        let startTime = dateTimeFromProcessingRequestID(processingEntry['request_id'])['start_time'];
        let clipNumber = getClipNumber(hh_mm_ss(startTime));
        isClipAvailable[clipNumber] = true;
    });

    return isClipAvailable;
}

/**
 * Prepares data in format as required by google-charts dataTable.
 * @param {*} data 
 * @param {*} date 
 * @returns Empty array.
 */

const prepareProcessingDataTableEntries = (recordingRawData, date) => {

    let processingRawData = recordingRawData.filter((entry) => {
        return (entry['stage_number'] != 1 && entry['stage_number'] != 6);
    });

    let highestStageNumberEntries = getHighestStageNumberEntries(processingRawData);   


    let processingDataTableContents = [];

    highestStageNumberEntries.forEach((entry) => {

        let category;                                       //  used to 
        let label;                                          //  used for storing hidden data for each entry to be used later.
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;
        
        let safeTyMargin = 2;

        category = 'Processing';
        label = '{"request_id": "' + entry['request_id'] + '", "device_id": "' + entry['device_id'] +'"}';

        
        //  color
        if (entry['stage_number'] == 5) {
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


        times = dateTimeFromProcessingRequestID(entry['request_id']);
        
        let startTime = times['start_time'];
        let endTime = times['end_time'];

        tooltip = entry['stage_message'] + ' ' + hh_mm_ss(startTime) + ' - ' + hh_mm_ss(endTime);

        startTimeTimeline = new Date(startTime);
        startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);
        
        endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);

        if (startTimeTimeline < endTimeTimeline) {
            processingDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
        }        

    });

    return processingDataTableContents;
}

const getDummyEntries = (recordingSlots, clipNoToProcessingEntry, inputDate) => {
    
    let dummyEntries = [];

    let currentTime = new Date();

    //  loop over recording slots
    for(let i = 0; i < recordingSlots.length; i++) {
        
        //  1. convert the start and end times to their corresponding clipNumbers
        let startRecordingTime = recordingSlots[i]['startRecordingTime'];
        let stopRecordingTime = recordingSlots[i]['stopRecordingTime'];

        let startClipNumber = getClipNumber(hh_mm_ss(startRecordingTime));
        let stopClipNumber = getClipNumber(hh_mm_ss(stopRecordingTime));

        let safeTyMargin = 2;

        //  2. loop through the clipNumbers
        for (let j = startClipNumber; j <= stopClipNumber; j++) {
            
            //  3. check if entry corresponding to that clipNumber is present in the mapping - clipNoToProcessingEntry
            if (!clipNoToProcessingEntry[j]) {

                let category;                                       //  used to 
                let label;                                          //  used for storing hidden data for each entry to be used later.
                let tooltip;
                let color;
            
                category = 'Processing';
                label = '';

                let [startTime, endTime] = clipNoToInterval(inputDate, j);

                //  if that slot is yet to occur, skip making any entry for it.
                if (startTime > currentTime) {
                    continue;
                }
                
                startTime = new Date(Math.max(startTime, startRecordingTime));
                endTime = new Date(Math.min(endTime, currentTime, stopRecordingTime));

                let stageMessage = 'Now Recording';
                let hoursElapsed = (currentTime - startTime) / (60 * 60 * 1000);
                
                //  If there is no entry for beyond 1hr.
                if (hoursElapsed > 1) {
                    stageMessage = 'Failed';
                }

                tooltip = stageMessage + " - " + hh_mm_ss(startTime) + " - " + hh_mm_ss(endTime);
                color = stageToColor[stageMessage];
                
                startTime.setMinutes(startTime.getMinutes() + safeTyMargin);
                endTime.setMinutes(endTime.getMinutes() - safeTyMargin);


                if (startTime < endTime) {
                    dummyEntries.push([category, label, tooltip, color, startTime, endTime]);                        
                }
            }
        }
    }

    return dummyEntries;
}

const prepareDummyDataTableEntries = (recordingGuideRawData, recordingRawData, date) => {

    let processingRawData = recordingRawData.filter((entry) => {
        return (entry['stage_number'] != 1 && entry['stage_number'] != 6);
    });

    let isClipNumberAvailable = makeAvailableClipsMap(processingRawData);

    let recordingSlots = createRecordingSlotsFromRecordingGuideEntries(recordingGuideRawData, date);

    let dummyDataTableEntries = getDummyEntries(recordingSlots, isClipNumberAvailable, date);

    return dummyDataTableEntries;
}

const updateSummaryTable = (formattedData, blankRawData, params) => {
    
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
        else if (stage == 'Now Recording') {
            status = summaryStagesEnum.inprogress;
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

    //  5. add them to the base URL of redirect view.
    let redirectURL = addGETParameters(new URL(window.location.origin + "/ui/recording_graph_ui_redirect"), GETparams);

    //  6. open that URL in a new tab.
    window.open(redirectURL);
}

const linkToBlankFramesUI = () => {
    
    //  get the current URL & change it to get the URL for blank UI

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

google.charts.setOnLoadCallback(() => {

    //  extract date from current URL.
    let date = getDefaultDate(document.URL);

    //  patch:  set the date in the datepicker
    setDateInDatePicker('#date', date);

    //  patch:  add timeline-color-labels labels to page top.
    setColorLabels('#timeline-color-labels', timelineStagesEnum, timelineStageToGraphic);

    //  patch:  add summaryColorLabels at top of summaryTable.
    setColorLabels('#summary-color-labels', summaryStagesEnum, summaryStagesToGraphic);

    //  patch:  attach summaryTable to timelines
    attachSummaryToTimeline();

    //  patch: link to blankFrames UI
    linkToBlankFramesUI();

    //  specify the devices from which we need data from.
    let devices = ['a', 'b'];

    //  specify the tables from which each timeline would fetch data.
    let tables = ['RECORDING', 'INVALID_FRAME_TRACKING', 'RECORDING_GUIDE'];


    let processingMapping = [
        {"data_source_tables" : ["RECORDING_GUIDE"], "processing_method" : prepareRecordingGuideDataTableEntries},
        {"data_source_tables" : ["RECORDING"], "processing_method" : prepareStartStopDataTableEntries},
        {"data_source_tables" : ["RECORDING"], "processing_method" : prepareProcessingDataTableEntries},
        {"data_source_tables" : ["RECORDING_GUIDE", "RECORDING"], "processing_method" : prepareDummyDataTableEntries},
    ];

    //  main loop.
    channelValues.forEach((channelValue) => {
        devices.forEach((device) => { 

            //  a. prepare the params for each timeline.
            let params = {"date": date, "channel_values": channelValue, "device_id": device}; 

            //  b. prepare the timeline object.
            let timelineQuerySelector = "#" + device + "_" + channelValue;
            let timeline = initializeTimeline(timelineQuerySelector);

            //  c. get data for the timeline.
            let dataMappingPromise = getDataForTimeline(tables, params);

            //  d. populate info for each device.
            populateDevice(dataMappingPromise, timeline, params, processingMapping);
            
            //  e. refresh every 5 mins.
            setTimeout(populateDevice, 300000, dataMappingPromise, timeline, params, processingMapping);
        });
    });
});
