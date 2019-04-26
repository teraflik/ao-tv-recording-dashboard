let globalDataTable = {};

const timelineStagesEnum  = Object.freeze({
    "Expected Start Recording"  :   1,
    "Expected Stop Recording"   :   2,
    "Start Recording"           :   3, 
    "Uploading done"            :   4, 
    "Stop Recording"            :   5,
    "empty"                     :   6
});

// Ref:- https://stackoverflow.com/questions/21346967/using-value-of-enum-as-key-in-another-enum-in-javascript
const timelineStagesToGraphic = Object.freeze({
    [timelineStagesEnum['Expected Start Recording']] : {
                            "bgcolor" : "pink",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['Expected Stop Recording']]  : {
                            "bgcolor" : "violet",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['Start Recording']] : {
                            "bgcolor" : "green",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['Uploading done']]  : {
                            "bgcolor" : "blue",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['Stop Recording']]  : {
                            "bgcolor" : "black",
                            "innerHTML" : "",
                            },
    [timelineStagesEnum['empty']]           : {
                            "bgcolor" : "grey",
                            "innerHTML" : "",
                            }
});

const prepareStartStopDataTableEntries = (startStopRawData, date) => {

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
        color = timelineStagesToGraphic[timelineStagesEnum[[entry['stage_message']]]].bgcolor;
            
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

const prepareProcessingDataTableEntries = (filterRawData, date) => {
    
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

const prepareRecordingGuideDataTableEntries = (recordingGuideRawData, date) => {

    let recordingGuideDataTableEntries = [];

    recordingGuideRawData.forEach((recordingGuideEntry, index) => {
        
        //  corresponding to each entry in recoringGuideRawData, there will be two entries.
        //  1 for START
        //  2 for STOP

        let category;
        let label;
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;


        //  START ENTRY
        category = 'Expected';
        label = '';
        color = timelineStagesToGraphic[timelineStagesEnum[['Expected Start Recording']]].bgcolor;
        
        startTimeTimeline = new Date([date, recordingGuideEntry['start_time']].join(" "));

        endTimeTimeline = new Date(startTimeTimeline);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
        
        tooltip = "Expected Start Recording" + ' ' + hh_mm_ss(startTimeTimeline);

        console.log("date is ...");
        console.log(date);

        console.log("recordingGuideEntry['start_time'] is ....");
        console.log(recordingGuideEntry['start_time']);

        console.log("startTimeTimeline is ...");
        console.log(startTimeTimeline);

        recordingGuideDataTableEntries.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);


        //  STOP ENTRY
        color = timelineStagesToGraphic[timelineStagesEnum[['Expected Stop Recording']]].bgcolor;
        
        startTimeTimeline = new Date([date, recordingGuideEntry['stop_time']].join(" "));

        endTimeTimeline = new Date(startTimeTimeline);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
        
        tooltip = "Expected Stop Recording" + ' ' + hh_mm_ss(startTimeTimeline);
            
        recordingGuideDataTableEntries.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    });

    return recordingGuideDataTableEntries;
}

const prepareDataForGoogleChartTimeline = (data, date) => {

    let recordingRawData = data[0];
    let recordingGuideRawData = data[1];
    let filterRawData = data[2];

    let emptyEntryStartDate = new Date(date + " 00:00:00");
    
    let emptyEntryEndDate = new Date(emptyEntryStartDate);
    emptyEntryEndDate.setDate(emptyEntryEndDate.getDate() + 1);

    //  extract startStopRawData for device_id = 'a'
    let startStopRawData = recordingRawData.filter(function(entry) {
        return ((entry['device_id'] == 'a') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
    });

    if (startStopRawData.length == 0) {
        startStopRawData = recordingRawData.filter(function(entry) {
            return ((entry['device_id'] == 'b') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
        });
    }

    //  if no data recieved
    if (!recordingGuideRawData || recordingGuideRawData.length == 0) {
        return [['Empty', '', 'No filter recordings available', timelineStagesToGraphic[timelineStagesEnum[['empty']]].bgcolor, emptyEntryStartDate, emptyEntryEndDate]];
    }

    let startStopDataTableEntries = prepareStartStopDataTableEntries(startStopRawData, date);
    
    let processingDataTableEntries = prepareProcessingDataTableEntries(filterRawData, date);

    let recordingGuideDataTableEntries = prepareRecordingGuideDataTableEntries(recordingGuideRawData, date);

    let dataTableEntries = recordingGuideDataTableEntries.concat(startStopDataTableEntries).concat(processingDataTableEntries);

    return dataTableEntries;
}

const populateDevice = (apiCalls, timeline, params) => {
    
    resolveAll(apiCalls).then(([recordingRawData, recordingGuideRawData, filterRawData]) => {
     
        let formattedData = prepareDataForGoogleChartTimeline([recordingRawData, recordingGuideRawData, filterRawData], params['date']);
        let dataTable = populateTimeline(timeline, formattedData, params['date']);
    
    });
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    let date = setDefaultDate(document.URL).searchParams.get('date');

    let baseEndPoint = addGETParameters(getBaseEndPoint(tableName = 'FILTER_RECORDING_TRACKING'), {"date": date});

    //  patch:  set the date in the datepicker
    setDateInDatePicker('#date', date);

    //  patch:  add color labels to page top
    setColorLabels("#timeline-color-labels", timelineStagesEnum, timelineStagesToGraphic);

    let devices = ['a', 'b'];

    let tables = ['RECORDING', 'RECORDING_GUIDE', 'FILTER_RECORDING_TRACKING'];

    channelValues.forEach((channelValue) => {

        //  a. set params dict.
        let params = {"date": date, "channel_values": channelValue};

        //  b. initialize timeline
        let timelineQuerySelector = "#filter" + "_" + channelValue;
        let timeline = initializeTimeline(timelineQuerySelector);

        //  c. prepare requests to get data.            
        let apiCalls = [];
        tables.forEach((table) => {
            
            let tableRawDataEndPoint = addGETParameters(getBaseEndPoint(tableName = table), params);

            if (table == "RECORDING_GUIDE") {
                
                let deviceSpecificEndPoints = [];    
                devices.forEach((device) => {
                    deviceSpecificEndPoints.push(addGETParameters(tableRawDataEndPoint, {"device": device}));
                });
                apiCalls.push(getValidResponse(deviceSpecificEndPoints));
            
            }
            else {
                apiCalls.push($.get(tableRawDataEndPoint));
            }
        });

        //  d. 
        populateDevice(apiCalls, timeline, params);
        
        //  e. refresh every 5 mins.
        setTimeout(populateDevice, 300000, apiCalls, timeline, params);
    });
});