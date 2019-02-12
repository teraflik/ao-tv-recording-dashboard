var rectAndCircleTestData = [
    {times: [{"starting_time": 1355752800000,
            "display": "circle"}, {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
    {times: [{"starting_time": 1355759910000,
    "display":"circle"}, ]},
    {times: [{"starting_time": 1355761910000, "ending_time": 1355763910000}]}
];
var labelTestData = [
    {label: "person a", times: [{"starting_time": 1355752800000, "ending_time": 1355759900000}, {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
    {label: "person b", times: [{"starting_time": 1355759910000, "ending_time": 1355761900000}, ]},
    {label: "person c", times: [{"starting_time": 1355761910000, "ending_time": 1355763910000}]}
];
var iconTestData = [
    {class:"jackie", icon: "https://raw.githubusercontent.com/jiahuang/d3-timeline/master/examples/jackie.png", times: [
    {"starting_time": 1355752800000, "ending_time": 1355759900000}, 
    {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
    {class:"troll", icon: "https://raw.githubusercontent.com/jiahuang/d3-timeline/master/examples/troll.png", times: [
    {"starting_time": 1355759910000, "ending_time": 1355761900000,
    "display":"circle"}, ]},
    {class:"wat", icon: "https://raw.githubusercontent.com/jiahuang/d3-timeline/master/examples/wat.png", times: [
    {"starting_time": 1355761910000, "ending_time": 1355763910000}]}
];
var labelColorTestData = [
    {label: "person a", times: [{"color":"green", "label":"Weeee", "starting_time": 1355752800000, "ending_time": 1355759900000}, {"color":"blue", "label":"Weeee", "starting_time": 1355767900000, "ending_time": 1355774400000}]},
    {label: "person b", times: [{"color":"pink", "label":"Weeee", "starting_time": 1355759910000, "ending_time": 1355761900000}, ]},
    {label: "person c", times: [{"color":"yellow", "label":"Weeee", "starting_time": 1355761910000, "ending_time": 1355763910000}]}
];
var testDataWithColor = [
    {label: "fruit 1", fruit: "orange", times: [
    {"starting_time": 1355759910000, "ending_time": 1355761900000}]},
    {label: "fruit 2", fruit: "apple", times: [
    {"starting_time": 1355752800000, "ending_time": 1355759900000},
    {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
    {label: "fruit3", fruit: "lemon", times: [
    {"starting_time": 1355761910000, "ending_time": 1355763910000}]}
    ];
var testDataWithColorPerTime = [
    {label: "fruit 2", fruit: "apple", times: [
    {fruit: "orange", "starting_time": 1355752800000, "ending_time": 1355759900000},
    {"starting_time": 1355767900000, "ending_time": 1355774400000},
    {fruit: "lemon", "starting_time": 1355774400000, "ending_time": 1355775500000}]}
    ];
var testDataRelative = [
    {times: [{"starting_time": 1355752800000, "ending_time": 1355759900000}, {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
    {times: [{"starting_time": 1355759910000, "ending_time": 1355761900000}]},
    {times: [{"starting_time": 1355761910000, "ending_time": 1355763910000}]}
];

function timelineRectNoAxis() {
    var chart = d3.timeline().showTimeAxis();
    var svg = d3.select("#timeline1_noaxis").append("svg").attr("width", width)
    .datum(testData).call(chart);
}
function timelineCircle() {
    var chart = d3.timeline()
    .tickFormat( //
        {format: d3.time.format("%I %p"),
        tickTime: d3.time.hours,
        tickInterval: 1,
        tickSize: 30})
    .display("circle"); // toggle between rectangles and circles
    var svg = d3.select("#timeline2").append("svg").attr("width", width)
    .datum(testData).call(chart);
}
function timelineRectAndCircle() {
    var chart = d3.timeline();
    var svg = d3.select("#timeline2_combine").append("svg").attr("width", width)
    .datum(rectAndCircleTestData).call(chart);
}
function timelineHover() {
    var chart = d3.timeline()
    .width(width*4)
    .stack()
    .margin({left:70, right:30, top:0, bottom:0})
    .hover(function (d, i, datum) {
    // d is the current rendering object
    // i is the index during d3 rendering
    // datum is the id object
        var div = $('#hoverRes');
        var colors = chart.colors();
        div.find('.coloredDiv').css('background-color', colors(i))
        div.find('#name').text(datum.label);
    })
    .click(function (d, i, datum) {
        alert(datum.label);
    })
    .scroll(function (x, scale) {
        $("#scrolled_date").text(scale.invert(x) + " to " + scale.invert(x+width));
    });
    var svg = d3.select("#timeline3").append("svg").attr("width", width)
    .datum(labelTestData).call(chart);
}
function timelineStackedIcons() {
    var chart = d3.timeline()
    .beginning(1355752800000) // we can optionally add beginning and ending times to speed up rendering a little
    .ending(1355774400000)
    .showTimeAxisTick() // toggles tick marks
    .stack() // toggles graph stacking
    .margin({left:70, right:30, top:0, bottom:0})
    ;
    var svg = d3.select("#timeline5").append("svg").attr("width", width)
    .datum(iconTestData).call(chart);
}
function timelineLabelColor() {
    var chart = d3.timeline()
    .beginning(1355752800000) // we can optionally add beginning and ending times to speed up rendering a little
    .ending(1355774400000)
    .stack() // toggles graph stacking
    .margin({left:70, right:30, top:0, bottom:0})
    ;
    var svg = d3.select("#timeline6").append("svg").attr("width", width)
    .datum(labelColorTestData).call(chart);
}
function timelineRotatedTicks() {
    var chart = d3.timeline()
    .rotateTicks(45);
    var svg = d3.select("#timeline7").append("svg").attr("width", width)
    .datum(testData).call(chart);
}
function timelineRectColors() {
    var colorScale = d3.scale.ordinal().range(['#6b0000','#ef9b0f','#ffee00'])
        .domain(['apple','orange','lemon']);
    var chart = d3.timeline()
        .colors( colorScale )
        .colorProperty('fruit');
    var svg = d3.select("#timelineColors").append("svg").attr("width", width)
    .datum(testDataWithColor).call(chart);
}
function timelineRectColorsPerTime() {
    var colorScale = d3.scale.ordinal().range(['#6b0000','#ef9b0f','#ffee00'])
    .domain(['apple','orange','lemon']);
    var chart = d3.timeline()
    .colors( colorScale )
    .colorProperty('fruit');      
    var svg = d3.select("#timelineColorsPerTime").append("svg").attr("width", width)
    .datum(testDataWithColorPerTime).call(chart);  
}
function timelineRelativeTime() {
    //This solution is for relative time is from
    //http://stackoverflow.com/questions/11286872/how-do-i-make-a-custom-axis-formatter-for-hours-minutes-in-d3-js
    var chart = d3.timeline()
    .relativeTime()
    .tickFormat({
        format: function(d) { return d3.time.format("%H:%M")(d) },
        tickTime: d3.time.minutes,
        tickInterval: 30,
        tickSize: 15,
    });
    var svg = d3.select("#timelineRelativeTime").append("svg").attr("width", width)
    .datum(testDataRelative).call(chart);
    // console.log(testDataRelative);
}
function timelineAxisTop() {
    var chart = d3.timeline().showAxisTop().stack();
    var svg = d3.select("#timelineAxisTop").append("svg").attr("width", width)
        .datum(testData).call(chart);
}
function timelineBgndTick() {
    var chart = d3.timeline().stack().showTimeAxisTick().background('grey');
    var svg = d3.select("#timelineBgndTick").append("svg").attr("width", width)
        .datum(testData).call(chart);
}
function timelineBgnd() {
    var chart = d3.timeline().stack().background('grey');
    var svg = d3.select("#timelineBgnd").append("svg").attr("width", width)
        .datum(testData).call(chart);
}

function timelineComplex() {
    var chart = d3.timeline();
chart.stack();
chart.showTimeAxisTick();
//     chart.showAxisTop();
//     chart.showToday();
//     chart.itemHeight(50);
chart.margin({left: 250, right: 0, top: 20, bottom: 0});
chart.itemMargin(0);
chart.labelMargin(25);
var backgroundColor = "#FCFCFD";
var altBackgroundColor = "red";
chart.background(function (datum, i) {
    var odd = (i % 2) === 0;
    return odd ? altBackgroundColor : backgroundColor;
});
chart.fullLengthBackgrounds();
    var svg = d3.select("#timelineComplex").append("svg").attr("width", width)
        .datum(labelTestData).call(chart);
}

























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
// timelineRectNoAxis();
// timelineCircle();
// timelineRectAndCircle();
// timelineHover();
// timelineStackedIcons();
// timelineLabelColor();
// timelineRotatedTicks();
// timelineRectColors();
// timelineRectColorsPerTime();
// timelineRelativeTime();
// timelineAxisTop();
// timelineBgndTick();
// timelineBgnd();
// timelineComplex();