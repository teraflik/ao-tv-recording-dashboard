function yyyy_mm_dd(date) {
  var curr_date = date.getDate();
  var curr_month = date.getMonth() + 1; //Months are zero based
  var curr_year = date.getFullYear();
  return curr_year + "-" + curr_month + "-" + curr_date;

}

function prepareEndpoint() {
  //  In future, this will take a key value pair as argument which would be set as the URL parameters.
  var generalEndpoint = new URL(document.URL.replace('graph_ui/home', 'api/get'));

  // Endpoint for Sony Channel, device_id=a
  var sonyDeviceAEndpoint = new URL(generalEndpoint)
  sonyDeviceAEndpoint.searchParams.append("channel_values", 4);
  sonyDeviceAEndpoint.searchParams.append("device_id", 'a');


  if (!sonyDeviceAEndpoint.searchParams.get('date')) {
    sonyDeviceAEndpoint.searchParams.set('date', yyyy_mm_dd(new Date()));
  }
  return sonyDeviceAEndpoint;
}


// var testData = [
//   {label: "Recording", times: [{"starting_time": 1549913400000, "display": "circle", "color": "lightgreen"}, 
//                                 {"starting_time": 1549929600000, "display": "circle", "color": "red"}]},
//   {label: "Processing", times: [{"starting_time": 1549927800000, "ending_time": 1549929600000, "color": "purple", "label": "C.S."},
//                                 {"starting_time": 1549913400000, "ending_time": 1549915200000, "color": "magenta", "label": "U.D."}]}
// ];

var globalRawData;

function formatData(rawData, endpoint) {
  
  //  get row corresponding to "stage number": [1, 6]
  startRecordingRows = rawData.filter(function(row) { return row["stage_number"] == 1; });
  stopRecordingRows = rawData.filter(function(row) { return row["stage_number"] == 6; });
  
  
  //  extract time of the start and stop. Make this flexible for multiple start and stop recording
  var recordingArray = [];
  for(i = 0; i < startRecordingRows.length; i++) {
    recordingArray.push({"starting_time": new Date(startRecordingRows[i]["timestamp"]).valueOf(), "display": "circle", "color": "green"});
  }

  for(i = 0; i < stopRecordingRows.length; i++) {
    recordingArray.push({"starting_time": new Date(stopRecordingRows[i]["timestamp"]).valueOf(), "display": "circle", "color": "red"});
  }
  
  //  filter out the processing rows
  processingRows = rawData.filter(function(row) { return (row["stage_number"] != 1 && row["stage_number"] != 6); })
  
  
  //  get the latest stage_number for all the processing rows
  hashMap = {}
  for(i = 0; i < processingRows.length; i++) {
    if (!hashMap[processingRows[i]["request_id"]]) {
      hashMap[processingRows[i]["request_id"]] = processingRows[i]["stage_number"];
    }
    else if (hashMap[processingRows[i]["request_id"]] < processingRows[i]["stage_number"]) {
      hashMap[processingRows[i]["request_id"]] = processingRows[i]["stage_number"];
    }
  }
  console.log(hashMap);
  //  1. map request_id to seconds offset and 2. stage_number to a color.
  var stageToColor = {2: "yellow", 3: "orange", 4: "maroon", 5: "brown"};

  var today = endpoint.searchParams.get('date');


  // var date = new Date(endpoint.searchParams.get('date') + " 00:00:00");
  var processingArray = [];
  for (var key in hashMap) {
    var color = stageToColor[hashMap[key]];
    var time = key.split("_")[2];
    time = new Date(today + " " + time[0] + time[1] + ":" + time[2] + time[3] + ":" + time[4] + time[5]).valueOf();
    processingArray.push({
                  "color": color,
                  "starting_time": time + 2 * 60 * 1000,
                  "ending_time": time + 1800000 - 2 * 60 * 1000,

    });
  }

  console.log(processingArray);
  
  
  //  create data with entry
  var formattedData = [
    {label: "Recording", times: recordingArray},
    {label: "Processing", times: processingArray}
  ];


  return formattedData;
}


function updateTimeline(chart) {

  //  Get new data
  newData = 
  
  //  Remove the old element
  d3.select("svg").remove();
  
  //  Create the new element
var svg = d3.select("#timeline1")
              .append("svg")
              .attr("width", width)
              .datum(testData)
              .call(chart);
}

function main(rawData, endpoint) {

  //  fill in data according 
  var formattedData = formatData(rawData, endpoint);
  globalRawData = rawData;
  
  // configure the timeline
  var width = 1000;
  var date = new Date(endpoint.searchParams.get('date') + " 00:00:00");
  var chart = d3.timeline()
                .showTimeAxisTick()
                .width(width*3)
              //   .rowSeparators("yellow")
                .display("rect")
              //   .background('silver')
                .beginning(date.valueOf())
                .itemHeight(30)
              //   .itemMargin(15)
                .ending(date.valueOf() + 86400000)
                .rotateTicks(45)
                .stack()
                .tickFormat( //
                  {format: d3.time.format("%H:%M"),
                  tickTime: d3.time.minutes,
                  tickInterval: 30,
                  tickSize: 6});

    // Create the timeline using d3
    var svg = d3.select("#timeline1")
                .append("svg")
                .attr("id", "sony")     //  replace the hardcoding
                .attr("width", width)
                .datum(formattedData)
                .call(chart);
  
  // setInterval(function() {
  //               updateTimeline(chart, "#sony");
  // }, 10000);
}

function getData(endpoint) {
  var toBeReturned;
  $.ajax({
    type: 'GET',
    url: endpoint,
    async: false,
    dataType: 'json',
    success: function(rawData){
              toBeReturned = rawData;
    }
  });
  return toBeReturned;
}


$(document).ready(function(){
  //  1. prepare the API endpoint to be hit.
  var endpoint = prepareEndpoint()
  console.log("The endpoint is :- " + endpoint);

  //  2. get the data from the endpoint.
  var rawData = getData(endpoint);
  console.log("data recieved is :- ");
  console.log(rawData);
  
  main(rawData, endpoint);
});