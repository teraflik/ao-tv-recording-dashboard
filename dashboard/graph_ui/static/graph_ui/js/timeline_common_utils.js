google.charts.load('46', {'packages':['timeline']});

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

const setDateInDatePicker = (datePickerElementID, dateValue) => {
    let dateElement = document.getElementById(datePickerElementID);
    dateElement.value = dateValue;
}

const getBaseEndPoint = (defaultDate) => {

    //  Get the REST API endpoint to hit from current URL.
    var baseEndPoint = new URL(document.URL.replace('graph_ui', 'api'));
  
    //  If no date passed
    if (!baseEndPoint.searchParams.get('date')) {
        
        if (defaultDate == 'today') {
            baseEndPoint.searchParams.set('date', yyyy_mm_dd(new Date()));
        }
        else if (defaultDate == 'yesterday') {
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate()  - 1);
    
            baseEndPoint.searchParams.set('date', yyyy_mm_dd(yesterday));
        }
    }

    //  Remove search parameters other than date.
    var parameters = Array.from(baseEndPoint.searchParams.keys()).filter(x => x != 'date');
    for (var i = 0; i < parameters.length; i++) {
        baseEndPoint.searchParams.delete(parameters[i]);
    }
    return baseEndPoint;
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

// const initializeTimeline = (endpoint) => {
//     let deviceID = endpoint.searchParams.get('device_id');
//     let channelValue = endpoint.searchParams.get('channel_values');
    
//     let divID = deviceID + "_" + channelValue;
//     let container = document.getElementById(divID);
//     return new google.visualization.Timeline(container);
// }