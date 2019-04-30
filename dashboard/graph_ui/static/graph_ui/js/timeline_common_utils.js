google.charts.load('46', {'packages':['timeline']});

const DBNAME_TO_URL_PATHNAME_MAPPING = Object.freeze({
    "RECORDING"                 :   "/api/recording", 
    "RECORDING_GUIDE"           :   "/api/recording_guide",
    "RECORDING_TRACKING"        :   "/api/recording_tracking",
    "FILTER_RECORDING_TRACKING" :   "/api/filter_recording_tracking",
    "INVALID_FRAME_TRACKING"    :   "/api/blank"
});

const dataTableEnum  = Object.freeze({
    "category"    :   0, 
    "label"   :   1, 
    "tooltip" :   2,
    "color" :   3,
    "startTime" :   4,
    "endTime" :   5,
});

const dateTimeFromProcessingRequestID = (request_id) => {
    
    let date = request_id.split("_")[0];
    let formattedDate = date[0] + date[1] + date[2] + date[3] + "-" + date[4] + date[5] + '-' + date[6] + date[7];
    let time = request_id.split("_")[2];
    let formattedTime = time[0] + time[1] + ":" + time[2] + time[3] + ":" + time[4] + time[5];

    let clipNumber = getClipNumber(formattedTime);
    let nextTimeSeconds = clipNumber * 1800;

    //  creating startTime object
    let startTime = new Date(formattedDate + " " + formattedTime);

    //  creating endTime object
    let endTime = new Date(formattedDate + " " + "00:00:00");
    endTime.setSeconds(nextTimeSeconds);
    
    return {
        'start_time': startTime,
        'end_time': endTime
    }
}

const initializeDataTable = () => {

    let dataTable = new google.visualization.DataTable();
    dataTable.addColumn({ type: 'string', id: 'category' });
    dataTable.addColumn({ type: 'string', id: 'Name' });
    dataTable.addColumn({ type: 'string', id: 'tooltip', role: 'tooltip' });
    dataTable.addColumn({ type: 'string', id: 'color', role: 'style' });
    dataTable.addColumn({ type: 'date', id: 'Start' });
    dataTable.addColumn({ type: 'date', id: 'End' });
    
    return dataTable;
}

const reverseJsonMapper = (originalMapping) => {
    let reverseMapping = {};

    for (key in originalMapping) {
        if (originalMapping.hasOwnProperty(key)) {
            reverseMapping[originalMapping[key]] = key;
        }
    }

    return reverseMapping;
}

const clipNoToInterval = (dateString, clipNumber) => {
    let startTime = new Date(dateString + " 00:00:00");
    let endTime = new Date(dateString + " 00:00:00");

    startTime.setMinutes((clipNumber - 1) * 30);
    endTime.setMinutes(clipNumber * 30);

    return [startTime, endTime];
}

const removeDuplicateObjects = (objectArray) => {

    let uniqueStringArray = new Set(objectArray.map(e => JSON.stringify(e)));
    let uniqueObjectArray = Array.from(uniqueStringArray).map(e => JSON.parse(e));
    return uniqueObjectArray;
}

const setDateInDatePicker = (datePickerElementQuerySelector, dateValue) => {
    let datePickerElement = document.querySelector(datePickerElementQuerySelector);
    datePickerElement.value = dateValue;
}

const setColorLabels = (querySelector, stagesEnum, stageToGraphic) => {
    
    let table = document.querySelector(querySelector);
    let trElement = table.childNodes[1].childNodes[1];

    Object.entries(stagesEnum).forEach(([stageName, stageNumber]) => {
        let stage = document.createElement("th");
        stage.innerText = stageName;

        let color = document.createElement("th");
        color.setAttribute("bgcolor", stageToGraphic[stageNumber].bgcolor);
        color.innerHTML = stageToGraphic[stageNumber].innerHTML;

        trElement.appendChild(color);
        trElement.appendChild(stage);
    });
    
}

const getBaseEndPoint = (tableName) => {

    let protocol = window.location.protocol;
    let host = window.location.host;
    let pathname = DBNAME_TO_URL_PATHNAME_MAPPING[tableName];
        
    let baseEndPoint = new URL(protocol + "//" + host + pathname);

    return baseEndPoint;
}

/**
 * Returns `date` param from URL if exists, else returns today's date, in yyyy-mm-dd format.
 * @param {*} endpoint 
 */
const getDefaultDate = (endpoint) => {
    return new URL(endpoint).searchParams.get("date") || yyyy_mm_dd(new Date());
}

/**
 * Takes an array of endpoints, loops through them sequentially
 * @param {Array} endpoints 
 */
const getValidResponse = (endpoints) => {

    return new Promise((resolve, reject) => {
        
        if (Array.isArray(endpoints)) {
            const arrayLength = endpoints.length;
            endpoints.forEach((endpoint, index) => {
    
                $.get(endpoint).then((response) => {
                    
                    if (response.length > 0) {
                        resolve(response);
                    }
                    else if (index == arrayLength - 1) {
                        resolve([]);
                    }
                });
            });
        } 
        
        else {
            $.get(endpoints).then((response) => {
                resolve(response);
            });
        }
    });
}

const initializeTimeline = (timelineQuerySelector) => {

    let container = document.querySelector(timelineQuerySelector);
    return new google.visualization.Timeline(container);
}

const populateTimeline = (timeline, formattedData, date) => {

    //  1. create dataTable object
    let dataTable = initializeDataTable();

    //  2. add the data to the dataTable object
    dataTable.addRows(formattedData);
    
    //  3. define options.
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
            },
        width: '100%',
        height: '145'
    };
    
    //  4. feed data to the timeline.
    timeline.draw(dataTable, options);

    return dataTable;
}

const getDataForTimeline = (tables, params) => {

    let apiCalls = tables.map((table) => {
        let tableRawDataEndPoint = addGETParameters(getBaseEndPoint(tableName = table), params);
        return $.get(tableRawDataEndPoint);
    });

    return new Promise((resolve, reject) => {
        
        resolveAll(apiCalls).then((data) => {
            
            //  create a mapping of {"<tableName>" : "<tableRawData>"}
            let dataMapping = {};

            tables.forEach((table, index) => {
                dataMapping[table] = data[index];
            });

            resolve(dataMapping);
        });

    });
}

const prepareStartStopDataTableEntries = (recordingRawData, date) => {
    
    //  A. Extracting StartStopEntries from recordingRawData

    let startStopRawData = recordingRawData.filter(function(entry) {
        return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
    });
    

    //  B. prepare dataTableContent.

    let startStopDataTableContents = [];

    for(let i = 0; i < startStopRawData.length; i++) {
        let entry = startStopRawData[i];

        let category;
        let label;
        let tooltip;
        let color;
        let startTimeTimeline;
        let endTimeTimeline;


        category = 'Recording';
        label = '';
        color = timelineStageToGraphic[timelineStagesEnum[[entry['stage_message']]]].bgcolor;
            
        startTimeTimeline = new Date(entry['timestamp']);

        endTimeTimeline = new Date(entry['timestamp']);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
        
        tooltip = entry['stage_message'] + ' ' + hh_mm_ss(startTimeTimeline);
            
        startStopDataTableContents.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    }

    //  3. return it.
    return startStopDataTableContents;
}

const prepareRecordingGuideDataTableEntries = (recordingGuideRawData, date) => {

    let recordingGuideDataTableEntries = [];

    recordingGuideRawData.forEach((recordingGuideEntry) => {
        
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
        color = timelineStageToGraphic[timelineStagesEnum[['Expected Start Recording']]].bgcolor;
        
        startTimeTimeline = new Date([date, recordingGuideEntry['start_time']].join(" "));

        endTimeTimeline = new Date(startTimeTimeline);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
        
        tooltip = "Expected Start Recording" + ' ' + hh_mm_ss(startTimeTimeline);

        recordingGuideDataTableEntries.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);


        //  STOP ENTRY
        color = timelineStageToGraphic[timelineStagesEnum[['Expected Stop Recording']]].bgcolor;
        
        startTimeTimeline = new Date([date, recordingGuideEntry['stop_time']].join(" "));

        endTimeTimeline = new Date(startTimeTimeline);
        endTimeTimeline.setMinutes(endTimeTimeline.getMinutes() + 1);
        
        tooltip = "Expected Stop Recording" + ' ' + hh_mm_ss(startTimeTimeline);
            
        recordingGuideDataTableEntries.push([category, label, tooltip, color, startTimeTimeline, endTimeTimeline]);
    });

    return recordingGuideDataTableEntries;
}

const prepareDataForGoogleChartTimeline = (dataMapping, dataProcessingMappings, date) => {

    let totalFormattedData = [];

    dataProcessingMappings.forEach((dataProcessingMapping) => {
        
        let tables = dataProcessingMapping.data_source_tables;
        
        let dataArray = tables.map(table => dataMapping[table]);

        let processingMethod = dataProcessingMapping.processing_method;

        totalFormattedData = totalFormattedData.concat(processingMethod(...dataArray, date));
    });

    if (totalFormattedData.length == 0) {
        
        let emptyEntryStartDate = new Date(date + " 00:00:00");
    
        let emptyEntryEndDate = new Date(emptyEntryStartDate);
        emptyEntryEndDate.setDate(emptyEntryEndDate.getDate() + 1);
        
        totalFormattedData = [['Empty', '', 'No recordings available', timelineStageToGraphic[timelineStagesEnum[['Empty']]].bgcolor, emptyEntryStartDate, emptyEntryEndDate]];
    }

    return totalFormattedData;
}