const attachSummaryToTimeline = () => {
    
    for(let i = 0; i < channelValues.length; i++) {

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

    }
}

const updateTotalBlankMinutes = (recordingRawData, blankRawData, params) => {

    //  get the HTML DOM element where this is going to happen
    let channelValue = params['channel_values'];
    let deviceID = params['device_id'];
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

const populateDevice = (dataMappingPromise, timeline, params, processingMapping) => {
    
    dataMappingPromise.then((dataMapping) => {
     
        let formattedData = prepareDataForGoogleChartTimeline(dataMapping, processingMapping, params['date']);
        
        let dataTable = populateTimeline(timeline, formattedData, params['date']);

        updateSummaryTable(formattedData, dataMapping['INVALID_FRAME_TRACKING'], params);
        
        updateTotalBlankMinutes(dataMapping['RECORDING'], dataMapping['INVALID_FRAME_TRACKING'], params);
        
        google.visualization.events.addListener(timeline, 'select', () => {
            selectHandler(timeline, dataTable);
        });
    
    });
}