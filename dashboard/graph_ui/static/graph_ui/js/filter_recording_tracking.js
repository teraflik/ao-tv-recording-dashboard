const timelineStagesEnum  = Object.freeze({
    "Expected Start Recording"  :   1,
    "Expected Stop Recording"   :   2,
    "Start Recording"           :   3, 
    "Uploading done"            :   4, 
    "Stop Recording"            :   5,
    "Empty"                     :   6
});

// Ref:- https://stackoverflow.com/questions/21346967/using-value-of-enum-as-key-in-another-enum-in-javascript
const timelineStageToGraphic = Object.freeze({
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
    [timelineStagesEnum['Empty']]           : {
                            "bgcolor" : "grey",
                            "innerHTML" : "",
                            }
});


const prepareStartStopDataTableEntriesFilterRecordingWrapper = (recordingRawData, date) => {
    
    let device = 'a';

    let startStopRawData = recordingRawData.filter(function(entry) {
        return ((entry['device_id'] == 'a') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
    });

    if (startStopRawData.length == 0) {
        device = 'b';
        startStopRawData = recordingRawData.filter(function(entry) {
            return ((entry['device_id'] == 'b') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
        });
    }

    let singleDeviceRecordingRawData = recordingRawData.filter(function(entry) {
        return (entry['device_id'] == device);
    });

    return prepareStartStopDataTableEntries(singleDeviceRecordingRawData, date);
}

const prepareProcessingDataTableEntries = (filterRawData, date) => {
    
    let processingDataTableContents = [];

    filterRawData.forEach((entry) => {

        let category;                                       //  used to 
        let label;                                          //  used for storing hidden data for each entry to be used later.
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;
        
        let safeTyMargin = 2;

        category = 'Processing';
        label = '{"clip_path": "' + entry['clip_path'] + '"}';
        color = 'blue';

        times = dateTimeFromProcessingRequestID(entry['request_id']);
        
        let startTime = times['start_time'];

        let endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + entry['clip_duration']);

        tooltip = entry['device_id'] + ' ' + hh_mm_ss(startTime) + ' - ' + hh_mm_ss(endTime);

        startTimeTimeline = new Date(startTime);
        startTimeTimeline.setMinutes(startTimeTimeline.getMinutes() + safeTyMargin);

        endTimeTimeline = new Date(endTime);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() - safeTyMargin);

        if (startTimeTimeline < endTimeTimeline) {
            processingDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
        }

    });

    //  3. return it.
    return processingDataTableContents;
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

    // 4. extract the value of the clip_path.
    let clipPath = labelJSON['clip_path'];

    //  5. get streamURL from clip_path
    let streamURL = clipPath.replace("gs://", "https://storage.cloud.google.com/");

    //  5. open that URL in a new tab.
    window.open(streamURL);
}

const populateDevice = (dataMappingPromise, timeline, params, processingMapping) => {
    
    dataMappingPromise.then((dataMapping) => {
     
        let formattedData = prepareDataForGoogleChartTimeline(dataMapping, processingMapping, params['date']);
        
        let dataTable = populateTimeline(timeline, formattedData, params['date']);

        google.visualization.events.addListener(timeline, 'select', () => {
            selectHandler(timeline, dataTable);
        });
    
    });
}

google.charts.setOnLoadCallback(() => {
    
    //  extract date from current URL.
    let date = getDefaultDate(document.URL);

    //  patch:  set the date in the datepicker
    setDateInDatePicker('#date', date);

    //  patch:  add color labels to page top
    setColorLabels("#timeline-color-labels", timelineStagesEnum, timelineStageToGraphic);

    let devices = ['a', 'b'];

    let tables = ['RECORDING', 'RECORDING_GUIDE', 'FILTER_RECORDING_TRACKING'];

    let processingMapping = [
        {"data_source_tables" : ["RECORDING_GUIDE"], "processing_method" : prepareRecordingGuideDataTableEntries},
        {"data_source_tables" : ["RECORDING"], "processing_method" : prepareStartStopDataTableEntriesFilterRecordingWrapper},
        {"data_source_tables" : ["FILTER_RECORDING_TRACKING"], "processing_method" : prepareProcessingDataTableEntries},
    ];

    channelValues.forEach((channelValue) => {

        //  a. set params dict.
        let params = {"date": date, "channel_values": channelValue};

        //  b. initialize timeline
        let timelineQuerySelector = "#filter" + "_" + channelValue;
        let timeline = initializeTimeline(timelineQuerySelector);

        //  c. prepare requests to get data.
        let dataMappingPromise = getDataForTimeline(tables, params);

        //  d. 
        populateDevice(dataMappingPromise, timeline, params, processingMapping);
        
        //  e. refresh every 5 mins.
        setTimeout(populateDevice, 300000, dataMappingPromise, timeline, params, processingMapping);
    });
});