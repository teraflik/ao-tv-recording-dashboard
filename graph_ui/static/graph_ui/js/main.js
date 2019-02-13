var testData = [
    {label: "Recording", times: [{"starting_time": 1549913400000, "display": "circle", "color": "lightgreen"}, 
                                 {"starting_time": 1549929600000, "display": "circle", "color": "red"}]},
    {label: "Processing", times: [{"starting_time": 1549927800000, "ending_time": 1549929600000, "color": "purple", "label": "C.S."},
                                  {"starting_time": 1549913400000, "ending_time": 1549915200000, "color": "magenta", "label": "U.D."}]}
];

var width = 1000;

function timelineRect() {
    var chart = d3.timeline()
                  .showTimeAxisTick()
                  .width(width*5)
                //   .rowSeparators("yellow")
                  .display("rect")
                //   .background('silver')
                  .beginning(1549909800000)
                  .itemHeight(30)
                //   .itemMargin(15)
                  .ending(1549996200000)
                  .rotateTicks(45)
                  .stack()
                  .tickFormat( //
                    {format: d3.time.format("%H:%M"),
                    tickTime: d3.time.minutes,
                    tickInterval: 30,
                    tickSize: 6});

    var svg = d3.select("#timeline1")
                .append("svg")
                .attr("width", width)
                .datum(testData)
                .call(chart);
}

function update(color) {

    //  Get new data
    testData[0]['times'][0]["color"] = color;
    
    //  Remove the old element
    d3.select("svg").remove();
    
    //  Create the new element
	var svg = d3.select("#timeline1")
                .append("svg")
                .attr("width", width)
                .datum(testData)
                .call(chart);
}


timelineRect();