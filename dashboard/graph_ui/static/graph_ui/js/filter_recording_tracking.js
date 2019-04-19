let globalDataTable = {};

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

    // console.log("startStopRawData is ....");
    // console.log(startStopRawData);

    //  if no data recieved
    if (!startStopRawData || startStopRawData.length == 0) {
        return [['Empty', '', 'No filter recordings available', timelineStagesToGraphic[timelineStagesEnum[['empty']]].bgcolor, startDate, endDate]];
    }

    let startStopDataTableContents = prepareStartStopEntries(startStopRawData, endpoint);
    
    let processingDataTableContents = prepareProcessingEntries(filterRawData, endpoint);

    let dataTableContents = startStopDataTableContents.concat(processingDataTableContents);

    return dataTableContents;
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

    //  2. making corresponding endpoint for recording_guide table.
    let recordingGuideEndPoint = new URL(endpoint.href);

    url = document.createElement('a');
    url.href = endpoint.href;
    protocol = url.protocol;
    host = url.host;
    path = '/api/recording_guide';
    searchParams = url.search;
    recordingGuideEndPoint = new URL(protocol + "//" + host + path + searchParams);
    recordingGuideEndPoint = addGETParameters(recordingGuideEndPoint, {'device_id': 'a'});

    $.when(

        //  1. get data from filterEndPoint
        $.get(filterEndPoint),

        //  2. get data from recordingEndPoint
        $.get(recordingEndPoint),

        //  3. get data from recordingGuideEndPoint
        $.get(recordingGuideEndPoint)

    ).then(function(filterEndPointResponse, recordingEndPointResponse, recordingGuideEndPointResponse) {
        
        let filterRawData = filterEndPointResponse[0];
        let recordingRawData = recordingEndPointResponse[0];
        let recordingGuideRawData = recordingGuideEndPointResponse[0];

        // console.log("filterRawData is.......");
        // console.log(filterRawData);

        // console.log("recordingRawData is.......");
        // console.log(recordingRawData);

        console.log("recordingGuideData is .........");
        console.log(recordingGuideRawData);


        let recordingSlots = createRecordingSlotsFromRecordingGuideEntries(recordingGuideRawData, endpoint.searchParams.get('date'));

        console.log("recorgingSlots are ...");
        console.log(recordingSlots);

        //  2. prepare data in the format to be feeded to the visualisation library.
        let formattedData = prepareDataForGoogleChartTimeline(recordingRawData, filterRawData, endpoint);

        // console.log("formattedData is.......");
        // console.log(formattedData);

        // //  3. If its today's date, then add current recordings

        let totalFormattedData = formattedData;

        //  3. create dataTable object
        let dataTable = initializeDataTable();

        //  4. add the data to the dataTable object
        dataTable.addRows(totalFormattedData);
        
        //  5. define options.
        let date = endpoint.searchParams.get('date');
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

    });
}

function initializeTimeline(endpoint) {
    let channelValue = endpoint.searchParams.get('channel_values');
    
    let divID = "filter_" + channelValue;
    let container = document.getElementById(divID);
    return new google.visualization.Timeline(container);
}

google.charts.setOnLoadCallback(function() {
    
    //  1. get baseEndPoint
    let baseEndPoint = getBaseEndPoint(defaultDate = 'yesterday');

    //  patch:  set the date in the datepicker
    setDateInDatePicker('date', baseEndPoint.searchParams.get('date'));

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