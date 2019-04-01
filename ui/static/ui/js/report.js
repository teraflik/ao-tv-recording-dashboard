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

function getJSONSynchronous(endpoint) {
    var data;
    $.ajax({
        type: 'GET',
        url: endpoint,
        async: false,
        dataType: 'json',
        success: function(response){
            data = response;
        }
    });
    return data;
}

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

function createRecordingSlots(startStopEntries, endpoint) {
    
    //  sort the startStopEntries according to timestamp in ASC order.
    startStopEntries.sort( (r1, r2) => {
        if (r1.timestamp < r2.timestamp) return -1;
        if (r1.timestamp > r2.timestamp) return 1;
        return 0;
    });
    
    //  extract date from endpoint and get today's date
    var date = endpoint.searchParams.get('date');
    var today = yyyy_mm_dd(new Date());

    var recordingSlots = [];

    var j = 0;
    for(var i = 0; i < startStopEntries.length; ) {
        
        var entry = {};
        var startRecordingDateTime;
        var stopRecordingDateTime;
        //  1. if the first entry is stop recording,
        //     then the slot will be from 
        //     dayStart - stopRecording
        if (startStopEntries[i]['stage_message'] == 'Stop Recording') {
            startRecordingDateTime = new Date(date + " 00:00:00");
            stopRecordingDateTime = new Date(startStopEntries[i]['timestamp']);
            
            //  jugaad: to prevent entering the next clipNumber
            stopRecordingDateTime.setMinutes(stopRecordingDateTime.getMinutes() - 2);

            i++;
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

function generateDailyReport(date) {

    //  1. obtain slot-information baseEndPoint
    var slotInfoBaseEndPoint = new URL(window.location.origin + "/api/recording");
    slotInfoBaseEndPoint.searchParams.set('date', date);

    //  2. obtain reportData baseEndPoint
    var reportDataBaseEndPoint = new URL(window.location.origin + "/api/filter_recording_tracking");
    reportDataBaseEndPoint.searchParams.set('date', date);

    //  3. create specificEndPoints (array of JSON Objects)
    var specificEndPoints = [];
    for (var i = 0; i < channelValues.length; i++) {
        //  
        entry = {};
        entry['slotInfo'] = addGETParameters(slotInfoBaseEndPoint.href, {'device_id': 'a', 'channel_values': channelValues[i]});
        entry['reportData'] = addGETParameters(reportDataBaseEndPoint.href, {'channel_values': channelValues[i]});
        
        specificEndPoints.push(entry);
    }

    //  4. loop over specificEndPoints to get formattedReportData

    var formattedReportData = [];
    var filteredFormattedReportData = [];

    for (var i = 0; i < specificEndPoints.length; i++) {

        var entry = specificEndPoints[i];
        var channelValue = entry['reportData'].searchParams.get('channel_values');

        //  a. get slotRawData from endPoint
        var recordingRawData = getJSONSynchronous(entry['slotInfo']);

        //  b. process to get slots
        var startStopEntries = recordingRawData.filter(function(entry) {
            return (entry['stage_number'] == 1 || entry['stage_number'] == 6);
        });

        var recordingSlots = createRecordingSlots(startStopEntries, entry['slotInfo']);
        console.log("details for channelValue = " + channelValue);
        
        console.log("recordingSlots is ...");
        console.log(recordingSlots);

        //  c. get reports rawData
        var reportRawData = getJSONSynchronous(entry['reportData']);

        //  d. process to get formattedReportData
        var groupedReportData = alasql('SELECT clip_number, SUM(clip_duration) AS total_time FROM ? GROUP BY clip_number',[reportRawData]);

        var indexedGroupedReportData = jsonIndexer(groupedReportData, 'clip_number');

        console.log("indexedGroupedReportData is ....");
        console.log(indexedGroupedReportData);

        var specificFormattedReportData = [];
        var specificFilteredFormattedReportData = [];

        var thresholdTotalTime = 29.8;

        for (var j = 0; j < recordingSlots.length; j++) {
            var slot = recordingSlots[j];

            var startingClipNumber = getClipNumber(hh_mm_ss(slot['startRecordingTime']));
            var endingClipNumber = getClipNumber(hh_mm_ss(slot['stopRecordingTime']));

            for (var clipNumber = startingClipNumber; clipNumber <= endingClipNumber; clipNumber++) {

                var reportDataEntry = indexedGroupedReportData[clipNumber];
                //  if we have entry for that clipNumber
                if (!!reportDataEntry) {

                    //  if total_time > thresholdTotalTime, then no blank data
                    if (reportDataEntry['total_time'] >= thresholdTotalTime) {
                        specificFormattedReportData.push({'channel_name': channels[channelValue], 'clip_number': clipNumber, 'blank_percentage': 0.0});
                    }
                    //  else, percentage blank data is calculated
                    else {
                        var blankPercentage = parseFloat(((1 - reportDataEntry['total_time'] / thresholdTotalTime) * 100).toFixed(1));
                        specificFormattedReportData.push({'channel_name': channels[channelValue], 'clip_number': clipNumber, 'blank_percentage': blankPercentage});
                    }
                }
                //  if we don't have entry for that clipNumber
                else {
                    specificFormattedReportData.push({'channel_name': channels[channelValue], 'clip_number': clipNumber, 'blank_percentage': 100.0});
                }
            }
        }

        specificFilteredFormattedReportData = specificFormattedReportData.filter(function (entry) {
            return entry['blank_percentage'] != 0.0;
        });

        console.log("specificFormattedReportData is ...");
        console.log(specificFormattedReportData);

        console.log("specificFilteredFormattedReportData is ...");
        console.log(specificFilteredFormattedReportData);

        formattedReportData = formattedReportData.concat(specificFormattedReportData);
        filteredFormattedReportData = filteredFormattedReportData.concat(specificFilteredFormattedReportData);
    }

    console.log("finished.........");
    return {
        "formattedReportData" : formattedReportData,
        "filteredFormattedReportData" : filteredFormattedReportData
    };
}

function generateWeeklyReport(startDate, endDate) {
    
    //  1. loop over startDate to endDate to get reportData of all the dates.
    var startDateTimeObject = new Date(startDate);
    var endDateTimeObject = new Date(endDate);

    var weeklyReport = [];
    for (var dateTimeObject = startDateTimeObject; dateTimeObject <= endDateTimeObject; dateTimeObject.setDate(dateTimeObject.getDate() + 1)) {

        var date = yyyy_mm_dd(dateTimeObject);
        var dailyReport = generateDailyReport(date);

        var channelWiseDailyReport = alasql('SELECT channel_name, AVG(blank_percentage) AS avg_blank FROM ? GROUP BY channel_name', [dailyReport['formattedReportData']]);
        var indexedChannelWiseDailyReport = jsonIndexer(channelWiseDailyReport, 'channel_name');

        console.log("indexedChannelWiseDailyReport ...");
        console.log(indexedChannelWiseDailyReport);
        
        var dailyEntryWeeklyReport = {'date': date};

        //  loop over channelValues array
        for (var i = 0; i < channelValues.length; i++) {
            var channelValue = channelValues[i];
            var channelName = channels[channelValue];

            //  if entry for that channelValue is available
            var channelDailyReport = indexedChannelWiseDailyReport[channelName];
            
            if (!!channelDailyReport) {
                dailyEntryWeeklyReport[channelName] = channelDailyReport['avg_blank'];
            }
            else {
                dailyEntryWeeklyReport[channelName] = 0;
            }
        }

        weeklyReport.push(dailyEntryWeeklyReport);
    }
    
    return weeklyReport;
}