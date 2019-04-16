//  DAILY REPORTS

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

const prepareRecordingSlotsFromRawData = (recordingRawData, date) => {

    let startStopEntries = recordingRawData.filter(function(entry) {
        return ((entry['device_id'] == 'a') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
    });

    if (startStopEntries.length == 0) {
        startStopEntries = recordingRawData.filter(function(entry) {
            return ((entry['device_id'] == 'b') && (entry['stage_number'] == 1 || entry['stage_number'] == 6));
        });
    }

    let recordingSlots = createRecordingSlots(startStopEntries, date);

    return recordingSlots;
}

const getDailyReportsRawData = (date) => {

    let slotInfoBaseEndPoint = addGETParameters(window.location.origin + "/api/recording", {"date": date});
    let reportDataBaseEndPoint = addGETParameters(window.location.origin + "/api/filter_recording_tracking", {"date": date});

    let apiCalls = [];

    //  3. LOOP THROUGH EACH CHANNEL
    channelValues.forEach((channelValue) => {
        
        //  1. creating specific endpoints for the channel
        let channelSpecificSlotInfoEndPoint = addGETParameters(slotInfoBaseEndPoint, {"channel_values": channelValue});
        let channelSpecificReportDataEndPoint = addGETParameters(reportDataBaseEndPoint, {"channel_values": channelValue});

        console.log("Details for channel = " + channelValue);
        console.log("slotInfoEndPoint is ... " + channelSpecificSlotInfoEndPoint.href);
        console.log("reportDataEndPoint is ... " + channelSpecificReportDataEndPoint.href);

        let slotInfoRequest = $.get(channelSpecificSlotInfoEndPoint);
        let reportDataRequest = $.get(channelSpecificReportDataEndPoint);

        apiCalls.push(slotInfoRequest)
        apiCalls.push(reportDataRequest)
    });

    return new Promise((resolve, reject) => {

        Promise.all(apiCalls).then((data) => {
            resolve(data); 
        });
    });
}

const preprocessDailyReport = (data, date) => {

    let formattedReportData = [];
    let filteredFormattedReportData = [];

    channelValues.forEach((channelValue, index) => {

        let channelSpecificFormattedReportData = [];
        let channelSpecificFilteredFormattedReportData = [];

        let slotRawData = data[2 * index];
        let reportRawData = data[2 * index + 1];

        let recordingSlots = prepareRecordingSlotsFromRawData(slotRawData, date);
        let blankPercentageData = alasql('SELECT clip_number, (1 - MIN(1, SUM(clip_duration)/29)) * 100 as blank_percentage FROM ? GROUP BY clip_number',[reportRawData]);
        let indexedBlankPercentageData = jsonIndexer(blankPercentageData, 'clip_number');

        //  LOOP OVER SLOTS
        recordingSlots.forEach((slot) => {

            let startingClipNumber = getClipNumber(hh_mm_ss(slot['startRecordingTime']));
            let endingClipNumber = getClipNumber(hh_mm_ss(slot['stopRecordingTime']));                

            for (let clipNumber = startingClipNumber; clipNumber <= endingClipNumber; clipNumber++) {

                let reportDataEntry = indexedBlankPercentageData[clipNumber];
                
                if (!!reportDataEntry) {
                    channelSpecificFormattedReportData.push({'channel_name': channels[channelValue], 'clip_number': clipNumber, 'blank_percentage': reportDataEntry['blank_percentage']});
                }
                else {
                    channelSpecificFormattedReportData.push({'channel_name': channels[channelValue], 'clip_number': clipNumber, 'blank_percentage': 100});
                }
            }
        });

        channelSpecificFilteredFormattedReportData = channelSpecificFormattedReportData.filter(function (entry) {
            return entry['blank_percentage'] != 0.0;
        });
        
        formattedReportData = formattedReportData.concat(channelSpecificFormattedReportData);
        filteredFormattedReportData = filteredFormattedReportData.concat(channelSpecificFilteredFormattedReportData);


        console.log("details for channelValue = " + channelValue);
        
        console.log("recordingSlots is ...");
        console.log(recordingSlots);

        console.log("indexedBlankPercentageData is ...");
        console.log(indexedBlankPercentageData);

        console.log("channelSpecificFormattedReportData is ...");
        console.log(channelSpecificFormattedReportData);

        console.log("channelSpecificFilteredFormattedReportData is ...");
        console.log(channelSpecificFilteredFormattedReportData);

    });

    return {
        "formattedReportData" : formattedReportData,
        "filteredFormattedReportData" : filteredFormattedReportData
    };
}

const generateDailyReport = (date) => {

    return new Promise((resolve, reject) => {

        getDailyReportsRawData(date).then((data) => {
            let processedDailyReportsData = preprocessDailyReport(data, date);
            resolve(processedDailyReportsData);
        });
    })
}

//  WEEKLY REPORTS
const getWeeklyReportsRawData = (startDate, endDate) => {

    let apiCalls = [];

    let startDateTimeObject = new Date(startDate);
    let endDateTimeObject = new Date(endDate);

    for (let dateTimeObject = startDateTimeObject; dateTimeObject <= endDateTimeObject; dateTimeObject.setDate(dateTimeObject.getDate() + 1)) {

        let date = yyyy_mm_dd(dateTimeObject);
        let dailyReportRequest = generateDailyReport(date);

        apiCalls.push(dailyReportRequest);
    }

    return new Promise((resolve, reject) => {

        Promise.all(apiCalls).then((data) => {
            resolve(data); 
        });
    });


}

const preprocessWeeklyReport = (data, startDate, endDate) => {
    
    
    let startDateTimeObject = new Date(startDate);
    let endDateTimeObject = new Date(endDate);

    let weeklyReport = [];
    for (let dateTimeObject = startDateTimeObject, index = 0; dateTimeObject <= endDateTimeObject; dateTimeObject.setDate(dateTimeObject.getDate() + 1), index++) {

        let date = yyyy_mm_dd(dateTimeObject);
        
        let dailyReport = data[index];

        let channelWiseDailyReport = alasql('SELECT channel_name, AVG(blank_percentage) AS avg_blank, COUNT(*) AS no_of_slots FROM ? GROUP BY channel_name', [dailyReport['formattedReportData']]);
        let indexedChannelWiseDailyReport = jsonIndexer(channelWiseDailyReport, 'channel_name');

        console.log("indexedChannelWiseDailyReport ...");
        console.log(indexedChannelWiseDailyReport);
        
        let dailyEntryWeeklyReport = {'date': date};

        //  loop over channelValues array
        for (let i = 0; i < channelValues.length; i++) {
            let channelValue = channelValues[i];
            let channelName = channels[channelValue];

            //  if entry for that channelValue is available
            let channelDailyReport = indexedChannelWiseDailyReport[channelName];
            

            if (!!channelDailyReport) {
                dailyEntryWeeklyReport[channelName] = channelDailyReport['avg_blank'].toFixed(2);
            }
            else {
                dailyEntryWeeklyReport[channelName] = "NA";
            }
        }

        weeklyReport.push(dailyEntryWeeklyReport);
    }
    
    return weeklyReport;
}

const generateWeeklyReport = (startDate, endDate) => {
    
    return new Promise((resolve, reject) => {

        getWeeklyReportsRawData(startDate, endDate).then((data) => {
            let processedWeeklyReportsData = preprocessWeeklyReport(data, startDate, endDate);
            resolve(processedWeeklyReportsData);
        });
    });
}