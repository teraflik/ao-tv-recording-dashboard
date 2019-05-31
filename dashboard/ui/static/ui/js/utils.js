/**
 * GENERIC UTILITIES 
 */

/**
 * Converts a `JavaScript Date Object` to `String yyyy-mm-dd`
 * @param {Date} dateObject - A JavaScript Date object
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
 * Converts a `JavaScript Date Object` to `String hh:mm:ss`
 * @param {Date} dateObject - A JavaScript Date object
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
 * Performs indexing on a given Array of JSONs using the given attribute, 
 * provided that each JSON has a unique value for that given attribute.
 * 
 * @param {Array} jsonArray - An array of JSONs.
 * @param {String} indexAttribute - Name of the attribute to be used as index. 
 * @returns {Object} Key-Value pair with `key`:`attribute_value` and `value`:`corresponding JSON Object`.
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
 * Adds GET Parameters to a given URL.
 * @param {String} baseEndPoint - A URL String.
 * @param {Object} GETParams - Key value pair with `key`: `attribute_name` & `value`: `attribute_value`
 * @returns {URLObject} with GETParams added to the URL.
 */
const addGETParameters = (baseEndPoint, GETParams) => {

    var specificEndPoint = new URL(baseEndPoint);
    
    for (var key in GETParams) {
        specificEndPoint.searchParams.set(key, GETParams[key]);
    }

    return specificEndPoint;
}


/**
 * Resolves an array of promises and returns their corresponding response data in the same order.
 * @param {Array} apiCalls -  Array of promises to resolve.
 * @returns {Array} of response data for each corresponding `Promise`.
 */
const resolveAll = (apiCalls) => {

    return new Promise((resolve, reject) => {

        Promise.all(apiCalls).then((data) => {
            resolve(data); 
        });
    });
}


/**
 * PROJECT SPECIFIC UTILITIES 
 */
const DBNAME_TO_URL_PATHNAME_MAPPING = Object.freeze({
    "RECORDING"                 :   "/api/recording", 
    "RECORDING_GUIDE"           :   "/schedule/api/schedule",
    "RECORDING_TRACKING"        :   "/api/recording_tracking",
    "FILTER_RECORDING_TRACKING" :   "/api/filter_recording_tracking",
    "INVALID_FRAME_TRACKING"    :   "/api/blank"
});


/**
 * Gets the REST-API EndPoint of a given Database Table.
 * @param {String} tableName - Name of the Database Table.
 * @returns {URLObject} REST-API EndPoint URL of the table. 
 */
const getBaseEndPoint = (tableName) => {

    let protocol = window.location.protocol;
    let host = window.location.host;
    let pathname = DBNAME_TO_URL_PATHNAME_MAPPING[tableName];
        
    let baseEndPoint = new URL(protocol + "//" + host + pathname);

    return baseEndPoint;
}

/**
 * Gets the corresponding unique clipNumber to a given time in the day. 
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
 * 
 * @param {*} columnNames 
 * @param {*} addFooter 
 */
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

/**
 * 
 * @param {*} querySelector 
 * @param {*} data 
 * @param {*} addFooter 
 * @param {*} options 
 */
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

/**
 * Gives the scheduled recordingSlots using the raw data obtained from `recording_guide` table.
 * 
 * It makes use of the `start_time` and `stop_time` attributes present in the data obtained from
 * `recording_guide` table's endpoint
 * 
 * 
 * @param {*} recordingGuideRawData 
 * @param {*} date 
 */
const createRecordingSlotsFromRecordingGuideEntries = (recordingGuideRawData, date) => {
    
    let recordingSlots = [];

    const SAFETY_MARGIN_MINUTES = 2;

    recordingGuideRawData.forEach((recordingGuideEntry) => {
        
        let startTimeString = recordingGuideEntry['rec_start'];
        let stopTimeString = recordingGuideEntry['rec_stop'];

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