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
    "Start Recording"   :  1,
    "Clipping Started"  :  2,
    "Clipping Done"     :  3,
    "Uploading start"   :  4,
    "Uploading done"    :  5,
    "Stop Recording"    :  6,
    "empty"             :  7,
    "Now Recording"     :  8,
    "Failed"            :  9,
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
    [timelineStagesEnum["empty"]]             :  {
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

const prepareDataForGoogleChartTimeline = (data, date) => {

    let recordingRawData = data[0];

    let startDate = new Date(date + " 00:00:00");
    
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    if (!recordingRawData || recordingRawData.length == 0) {
        return [['Empty', '', 'No recordings available', stageToColor['empty'], startDate, endDate]];
    }

    //  1. for each request_id, get single entry having the maximum stage_number
    let highestStageNumberEntries = getHighestStageNumberEntries(recordingRawData);    

    let formattedData = [];

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
        }

        if (startTimeTimeline < endTimeTimeline) {
            formattedData.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
        }
    }


    //  2.1 filter out recordingEntries and processingEntries
    let startStopEntries = recordingRawData.filter((entry) => {
        return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
    });

    //  2.2 sort these according to their timestamp (asc)
    startStopEntries.sort( (r1, r2) => {
        if (r1.timestamp < r2.timestamp) return -1;
        if (r1.timestamp > r2.timestamp) return 1;
        return 0;
    });

    //  2.3 filter the processing entries
    let processingEntries = formattedData.filter((dataTableEntry) => {
        return dataTableEntry[dataTableEnum.category] == 'Processing';
    });

    //  2.4 create a mapping of clipNumber --> processingEntry
    let clipNoToProcessingEntry = makeClipNoToProcessingEntry(processingEntries);

    //  2.5 make recording slots
    let recordingSlots = createRecordingSlots(startStopEntries, date);

    let dummyEntries = getDummyEntries(recordingSlots, clipNoToProcessingEntry, date);

    let totalFormattedData = formattedData.concat(dummyEntries);

    //  3. return it.
    return totalFormattedData;
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
    let deviceID = params['device_id'];
    let channelValue = params['channel_values'];
    let summaryBoxID = ['s', deviceID, channelValue].join("_");
    let summaryBox = document.getElementById(summaryBoxID);

    // fill the DOM Element with the details.
    summaryBox.innerHTML = innerHTML;
    summaryBox.setAttribute('bgcolor', bgcolor);
}

const makeClipNoToProcessingEntry = (processingEntries) => {
    
    let clipNoToProcessingEntry = {};
    
    for(let i = 0; i < processingEntries.length; i++) {
        let entry = processingEntries[i];
        let startTime = entry[dataTableEnum.startTime];

        let clipNumber = getClipNumber(hh_mm_ss(startTime));
        clipNoToProcessingEntry[clipNumber] = entry;
    }

    return clipNoToProcessingEntry;
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
    }

    return dummyEntries;
}

const selectHandler = (timeline, dataTable) => {

    let selectedDataTable = dataTable;
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

    window.open(redirectURL);
}

const linkToBlankFramesUI = () => {
    
    //  get the current URL & change it to get the URL for blank UI

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

const populateDevice = (apiCalls, timeline, params) => {
    
    resolveAll(apiCalls).then(([recordingRawData, blankRawData]) => {
     
        let formattedData = prepareDataForGoogleChartTimeline([recordingRawData, blankRawData], params['date']);
        
        let dataTable = populateTimeline(timeline, formattedData, params['date']);

        updateSummaryTable(formattedData, blankRawData, params);
        
        updateTotalBlankMinutes(recordingRawData, blankRawData, params);
        
        google.visualization.events.addListener(timeline, 'select', () => {
            selectHandler(timeline, dataTable);
        });
    
    });
}

google.charts.setOnLoadCallback(() => {

    let date = setDefaultDate(document.URL).searchParams.get('date');

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
    let tables = ['RECORDING', 'INVALID_FRAME_TRACKING'];

    //  main loop.
    channelValues.forEach((channelValue) => {
        devices.forEach((device) => { 

            //  a. set params dict.
            let params = {"date": date, "channel_values": channelValue, "device_id": device}; 

            //  b. initialize timeline
            let timelineQuerySelector = "#" + device + "_" + channelValue;
            let timeline = initializeTimeline(timelineQuerySelector);
 
            //  c. prepare requests to get data.            
            let apiCalls = [];
            tables.forEach((table) => {
                let tableRawDataEndPoint = addGETParameters(getBaseEndPoint(tableName = table), params);
                apiCalls.push($.get(tableRawDataEndPoint));
            });

            //  d. 
            populateDevice(apiCalls, timeline, params);
            
            //  e. refresh every 5 mins.
            setTimeout(populateDevice, 300000, apiCalls, timeline, params);
        });
    });
});
