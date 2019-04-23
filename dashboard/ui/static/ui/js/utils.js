/**
 * Makes a synchronous ajax request to given endpoint and returns an array of JSON as Response.
 * Incase of failure, returns an empty array. 
 * @param {string} endpoint - The API endpoint that serves the data.
 * @returns {Array} Response JSON array.
 */
const getJSONSynchronous = (endpoint) => {
    var data = [];
    $.ajax({
        type: 'GET',
        url: endpoint,
        async: false,
        dataType: 'json',
        success: function(response){
            data = response;
        },
        error: function() {
            data = [];
        }
    });
    return data;
}

/**
 * Gets date in `yyyy-mm-dd` format. 
 * @param {Date} dateObject - A JavaScript Date object whose corresponding `yyyy-mm-dd` we need
 * @returns {String} `yyyy-mm-dd` String.
 */
const yyyy_mm_dd = (dateObject) => {

    var dd = dateObject.getDate();
    var mm = dateObject.getMonth() + 1; //Months are zero based
    var yyyy = dateObject.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return [yyyy, mm, dd].join("-");
}

/**
 * Gets time in `hh:mm:ss` format. 
 * @param {Date} dateObject - A JavaScript Date object whose corresponding `hh:mm:ss` we need
 * @returns {String} `hh:mm:ss` String.
 */
const hh_mm_ss = (dateObject) => {

    var hh = dateObject.getHours();
    var mm = dateObject.getMinutes();
    var ss = dateObject.getSeconds();

    if (hh < 10) {
        hh = '0' + hh;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    if (ss < 10) {
        ss = '0' + ss;
    }

    return [hh, mm, ss].join(":")
}

/**
 * Gets the unique clipNumber corresponding to a given time in the day. 
 * @param {String} timeString - Time in `hh:mm:ss` format.
 * @returns {number} clipNumber corresponding to given time.
 */
const getClipNumber = (timeString) => {

    var hours = parseInt(timeString.split(":")[0]);
    var minutes = parseInt(timeString.split(":")[1]);

    var clipNumber = 2 * hours + 1;

    if (minutes >= 29)
     {
        clipNumber += 1;
    }

    if (minutes >= 59) {
        clipNumber += 1;
    }

    return clipNumber;
}

/**
 * Performs indexing on a given JSONArray as per given  
 * @param {Array} jsonArray - AN array of JSON 
 * @param {String} indexAttribute - A JavaScript Data object whose corresponding `yyyy-mm-dd` we need
 * @returns {String} `yyyy-mm-dd` String.
 */
const jsonIndexer = (jsonArray, indexAttribute) => {
    
    var index = {};
    
    for (var i = 0; i < jsonArray.length; i++) {
        var entry = jsonArray[i];
        var indexAttributeValue = entry[indexAttribute];
        index[indexAttributeValue] = entry;
    }

    return index;
}

/** 
 * Adds GET Parameters to a base URL given
 * @param {String} baseEndPoint - The base URL to 
 */
const addGETParameters = (baseEndPoint, GETParams) => {

    var specificEndPoint = new URL(baseEndPoint);
    
    for (var key in GETParams) {
        specificEndPoint.searchParams.set(key, GETParams[key]);
    }

    return specificEndPoint;
}

const setColumns = (columnNames, addFooter = false) => {

    rowHtml = '';

    $.each(columnNames, function(i, columnName) {
        columnHtml = '<th scope="col" class="' + columnName + '">' + columnName + '</th>';
        rowHtml += columnHtml;
    });

    $('tr#header-row').html(rowHtml);
    if (addFooter) {
        $('tr#footer-row').html(rowHtml);
    }
}

const createDataTable = (querySelector, data, addFooter, options) => {

    let columnNames = Object.keys(data[0]);
    setColumns(columnNames, addFooter);

    let columns = [];
    for (i = 0; i < columnNames.length; i++) {
        columns.push({"data": columnNames[i]});
    }

    options['columns'] = columns;
    options['data'] = data;

    var table = $(querySelector).DataTable(options);

    return table;

}

const createRecordingSlots = (startStopEntries, date) => {
    
    //  sort the startStopEntries according to timestamp in ASC order.
    startStopEntries.sort( (r1, r2) => {
        if (r1.timestamp < r2.timestamp) return -1;
        if (r1.timestamp > r2.timestamp) return 1;
        return 0;
    });
    
    //  extract date from endpoint and get today's date
    let today = yyyy_mm_dd(new Date());

    let recordingSlots = [];

    let j = 0;
    for(let i = 0; i < startStopEntries.length; ) {
        
        let entry = {};
        let startRecordingDateTime;
        let stopRecordingDateTime;

        //  1. if the first entry is stop recording,
        //     and corresponding clipNumber is 1, then skip it.

        //  1. if the first entry is stop recording,
        //     then the slot will be from 
        //     dayStart - stopRecording
        if (startStopEntries[i]['stage_message'] == 'Stop Recording') {

            startRecordingDateTime = new Date(date + " 00:00:00");
            stopRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
            
            if (getClipNumber(hh_mm_ss(stopRecordingDateTime)) == 1) {
                i++;
                continue;
            }
            else {
                //  jugaad: to prevent entering the next clipNumber
                stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);
                i++;
            }
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
    
                //  jugaad: to prevent entering the next clipNumber
                stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);
            }
            
            i++;
        }
        else {
            startRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
            stopRecordingDateTime = new Date(startStopEntries[i+1]['timestamp']);

            //  jugaad: to prevent entering the next clipNumber
            stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);

            i += 2;
        }

        entry['startRecordingTime'] = startRecordingDateTime;
        entry['stopRecordingTime'] = stopRecordingDateTime;

        recordingSlots.push(entry);
    }
    return recordingSlots;
}