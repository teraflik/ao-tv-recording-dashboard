/**
 * Makes a synchronous ajax request to given endpoint and returns an array of JSON as Response.
 * Incase of failure, returns an empty array. 
 * @param {string} endpoint - The API endpoint that serves the data.
 * @returns {Array} Response JSON array.
 */
function getJSONSynchronous(endpoint) {
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
function yyyy_mm_dd(dateObject) {

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
function hh_mm_ss(dateObject) {

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
function getClipNumber(timeString) {

    var hours = parseInt(timeString.split(":")[0]);
    var minutes = parseInt(timeString.split(":")[1]);

    var clipNumber = 2 * hours + 1;

    if (minutes >= 29) {
        clipNumber += 1;
    }

    if (minutes >= 59) {
        clipNumber += 1;
    }

    return clipNumber;
}

/**
 * Performs indexing on a given JSONArray as per given  
 * @param {Date} dateObject - A JavaScript Data object whose corresponding `yyyy-mm-dd` we need
 * @returns {String} `yyyy-mm-dd` String.
 */
function jsonIndexer(jsonArray, indexAttribute) {
    
    var index = {};
    
    for (var i = 0; i < jsonArray.length; i++) {
        var entry = jsonArray[i];
        var indexAttributeValue = entry[indexAttribute];
        index[indexAttributeValue] = entry;
    }

    return index;
}

function addGETParameters(baseEndPoint, GETParams) {

    var specificEndPoint = new URL(baseEndPoint);
    
    for (var key in GETParams) {
        specificEndPoint.searchParams.set(key, GETParams[key]);
    }

    return specificEndPoint;
}