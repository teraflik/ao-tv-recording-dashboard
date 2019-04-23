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

const prepareDataForGoogleChartTimeline = (recordingRawData, filterRawData, recordingGuideRawData, date) => {

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

const populateTimeline = (timeline, endpoint, index) => {
    
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

    //  2. making corresponding endpoint for recording_guide table.
    let recordingGuideEndPointA = new URL(endpoint.href);
    let recordingGuideEndPointB = new URL(endpoint.href);

    url = document.createElement('a');
    url.href = endpoint.href;
    protocol = url.protocol;
    host = url.host;
    path = '/api/recording_guide';
    searchParams = url.search;

    recordingGuideEndPointA = new URL(protocol + "//" + host + path + searchParams);
    recordingGuideEndPointA = addGETParameters(recordingGuideEndPointA, {'device_id': 'a'});

    recordingGuideEndPointB = new URL(protocol + "//" + host + path + searchParams);
    recordingGuideEndPointB = addGETParameters(recordingGuideEndPointB, {'device_id': 'b'});

    $.when(

        //  1. get data from filterEndPoint
        getValidResponse(filterEndPoint),

        //  2. get data from recordingEndPoint
        getValidResponse(recordingEndPoint),

        //  3. get data from recordingGuideEndPoint
        getValidResponse([recordingGuideEndPointA, recordingGuideEndPointB])

    ).then(function(filterRawData, recordingRawData, recordingGuideRawData) {
        
        // let recordingSlots = createRecordingSlotsFromRecordingGuideEntries(recordingGuideRawData, endpoint.searchParams.get('date') || yyyy_mm_dd(new Date()) );

        //  2. prepare data in the format to be feeded to the visualisation library.
        let dataTableEntries = prepareDataForGoogleChartTimeline(recordingRawData, filterRawData, recordingGuideRawData , endpoint.searchParams.get('date'));

        //  3. create dataTable object
        let dataTable = initializeDataTable();

        //  4. add the data to the dataTable object
        dataTable.addRows(dataTableEntries);
        
        //  5. define options.
        let date = endpoint.searchParams.get('date');
        let startDateTimeline = new Date(date + " 00:00:00");        
        let endDateTimeline = new Date(startDateTimeline);
        endDateTimeline.setDate(endDateTimeline.getDate() + 1);

        let options = {
            timeline: { showRowLabels: false, showBarLabels: false, barLabelStyle: { fontSize: 9 } },
            tooltip: { isHtml: false },
            hAxis: {
                    minValue: startDateTimeline,
                    maxValue: endDateTimeline,
                },
            width: '100%',
            height: '145'
        };
        
        //  6. feed data to the timeline.
        timeline.draw(dataTable, options);
        
        //  7. updating the globalDataTable lookup
        globalDataTable[index] = dataTable;

    });
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    let baseEndPoint = getBaseEndPoint(tableName = 'FILTER_RECORDING_TRACKING');

    // let filterBaseEndPoint = getBaseEndPoint(tableName = 'FILTER_RECORDING_TRACKING', defaultDate = 'yesterday');
    // let recordingBaseEndPoint = getBaseEndPoint(tableName = 'RECORDING', defaultDate = 'yesterday');
    // let recordingGuideBaseEndPoint = getBaseEndPoint(tableName = 'RECORDING_GUIDE', defaultDate = 'yesterday');

    //  patch:  set the date in the datepicker
    setDateInDatePicker('#date', baseEndPoint.searchParams.get('date'));

    //  patch:  add color labels to page top
    setColorLabels("#timeline-color-labels", timelineStagesEnum, timelineStagesToGraphic);

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

            let timelineQuerySelector = "#filter_" + specificEndPoints[i].searchParams.get('channel_values');
            timelines.push(initializeTimeline(timelineQuerySelector));

            //  no eventHandler required as of now.
            // google.visualization.events.addListener(timelines[i], 'select', function() {
            //     selectHandler(timelines[i], i);
            // });
        
        })(i);
    }

    //  4. populate charts with periodic refreshing
    for (let i = 0; i < timelines.length; i++) {
        populateTimeline(timelines[i], specificEndPoints[i], i);
        //  Since this isn't live tracking, no need to refresh every 5 mins. Manual refresh is enough.
    }
});