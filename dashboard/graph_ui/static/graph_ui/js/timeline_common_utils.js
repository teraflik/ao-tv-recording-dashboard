google.charts.load('46', {'packages':['timeline']});

const DBNAME_TO_URL_PATHNAME_MAPPING = Object.freeze({
    "RECORDING"                 :   "/api/recording", 
    "RECORDING_GUIDE"           :   "/api/recording_guide", 
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

const createRecordingSlotsFromRecordingGuideEntries = (recordingGuideRawData, date) => {
    
    let recordingSlots = [];

    const SAFETY_MARGIN_MINUTES = 2;

    recordingGuideRawData.forEach((recordingGuideEntry, index) => {
        
        let startTimeString = recordingGuideEntry['start_time'];
        let stopTimeString = recordingGuideEntry['stop_time'];

        if (startTimeString < stopTimeString) {

            //  This corresponds to a single slot spanning from (startTime - stopTime)
            let startRecordingTime = new Date([date, startTimeString].join(" "));
            let stopRecordingTime = new Date([date, stopTimeString].join(" "));
            
            //  patch: to prevent entering the next clipNumber
            stopRecordingTime.setMinutes(stopRecordingTime.getMinutes() - SAFETY_MARGIN_MINUTES);
 
            recordingSlots.push({
                "startRecordingTime"    :   startRecordingTime,
                "stopRecordingTime"     :   stopRecordingTime
            });
        }
        else {

            //  This corresponds to 2 slots

            //  1 from (00:00:00 - stopTime)
            let startRecordingTimeFirst = new Date([date, "00:00:00"].join(" "));
            let stopRecordingTimeFirst = new Date([date, stopTimeString].join(" "));
            
            //  patch: to prevent entering the next clipNumber
            stopRecordingTimeFirst.setMinutes(stopRecordingTimeFirst.getMinutes() - SAFETY_MARGIN_MINUTES);

            recordingSlots.push({
                "startRecordingTime"    :   startRecordingTimeFirst,
                "stopRecordingTime"     :   stopRecordingTimeFirst
            });


            //  2 from (startTime - 24:00:00)
            let startRecordingTimeSecond = new Date([date, startTimeString].join(" "));
            let stopRecordingTimeSecond = new Date([date, "24:00:00"].join(" "));
            
            //  patch: to prevent entering the next clipNumber
            stopRecordingTimeSecond.setMinutes(stopRecordingTimeSecond.getMinutes() - SAFETY_MARGIN_MINUTES);

            recordingSlots.push({
                "startRecordingTime"    :   startRecordingTimeSecond,
                "stopRecordingTime"     :   stopRecordingTimeSecond
            });       
        }
    });

    return recordingSlots;
}

const getBaseEndPoint = (tableName) => {

    let protocol = window.location.protocol;
    let host = window.location.host;
    let pathname = DBNAME_TO_URL_PATHNAME_MAPPING[tableName];
    let searchParams = url.search;
    let baseEndPoint = new URL(protocol + "//" + host + pathname + searchParams);

    return baseEndPoint;
}

const setDefaultDate = (endpoint) => {

    let date = endpoint.searchParams.get("date") || yyyy_mm_dd(new Date());
    return new URL(endpoint).searchParams.set("date", date);
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

const attachSummaryToTimeline = () => {
    
    for(let i = 0; i < channelValues.length; i++) {

        //  self invoking const to make a local scope for the index value which'll be used during callback.
        ((i) => {

            let summaryBoxIDA = "#s_a_" + channelValues[i];
            let timelineIDA = "#a_" + channelValues[i] + "_blank";
    
            $(summaryBoxIDA).click(() => {
                $('html,body').animate({
                    scrollTop: $(timelineIDA).offset().top},
                    'slow');
            });
    
            let summaryBoxIDB = "#s_b_" + channelValues[i];
            let timelineIDB = "#b_" + channelValues[i] + "_blank";
    
            $(summaryBoxIDB).click(() => {
                $('html,body').animate({
                    scrollTop: $(timelineIDB).offset().top},
                    'slow');
            });
    
        })(i);
    }
}

const updateTotalBlankMinutes = (recordingRawData, blankRawData, endpoint) => {

    //  get the HTML DOM element where this is going to happen
    let channelValue = endpoint.searchParams.get('channel_values');
    let deviceID = endpoint.searchParams.get('device_id');
    let divID = [deviceID, channelValue, "blank"].join("_");
    let DOMElement = document.getElementById(divID);
    
    if (!recordingRawData || recordingRawData.length == 0) {
        DOMElement.innerHTML = "No recordings available.";
        DOMElement.setAttribute('style', 'color: blue');
    }
    else if (!blankRawData || blankRawData.length == 0) {
        DOMElement.innerHTML = "No blank frames.";
        DOMElement.setAttribute('style', 'color: green');
    }
    else {
        let uniqueBlankRawData = removeDuplicateObjects(blankRawData);
        let totalBlankSeconds = 0;
        for(let i = 0; i < uniqueBlankRawData.length; i++) {
            let entry = uniqueBlankRawData[i];
            totalBlankSeconds += parseFloat(entry['invalid_frame_to']) - parseFloat(entry['invalid_frame_from']);
        }
        DOMElement.innerHTML = "" + (totalBlankSeconds / 60).toFixed(2) + " minutes of Blank Frames.";
        DOMElement.setAttribute('style', 'color: red');
    }
}