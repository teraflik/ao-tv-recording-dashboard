//  DAILY REPORTS
const preprocessDailyReport = (data, date) => {

    let formattedReportData = [];
    let filteredFormattedReportData = [];

    channelValues.forEach((channelValue, index) => {

        let channelSpecificFormattedReportData = [];
        let channelSpecificFilteredFormattedReportData = [];

        let recordingGuideRawData = data[2 * index];
        let reportRawData = data[2 * index + 1];

        let recordingSlots = createRecordingSlotsFromRecordingGuideEntries(recordingGuideRawData, date);

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

    });

    return {
        "formattedReportData" : formattedReportData,
        "filteredFormattedReportData" : filteredFormattedReportData
    };
}

const getDailyReportsRawData = (date) => {

    let slotInfoBaseEndPoint = addGETParameters(getBaseEndPoint(tableName = 'RECORDING_GUIDE'), {"date": date});
    let reportDataBaseEndPoint = addGETParameters(getBaseEndPoint(tableName = 'FILTER_RECORDING_TRACKING'), {"date": date});

    let apiCalls = [];

    //  3. LOOP THROUGH EACH CHANNEL
    channelValues.forEach((channelValue) => {
        
        //  1. creating specific endpoints for the channel
        let channelSpecificSlotInfoEndPoint = addGETParameters(slotInfoBaseEndPoint, {"channel_values": channelValue});
        let channelSpecificReportDataEndPoint = addGETParameters(reportDataBaseEndPoint, {"channel_values": channelValue});

        apiCalls.push($.get(channelSpecificSlotInfoEndPoint));
        apiCalls.push($.get(channelSpecificReportDataEndPoint));
    });

    return resolveAll(apiCalls);
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

    return resolveAll(apiCalls);
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