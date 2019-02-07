if (!$) {
    $ = django.jQuery;
}

var cachedRows = new Set();
var MYCLASS = 'poi';

function makeSet(arrayOfHtmlObjects) {
    var tempSet = new Set();
    for(i = 0; i < arrayOfHtmlObjects.length; i++) {
        tempSet.add(arrayOfHtmlObjects[i].innerHTML);
    }
    return tempSet;
}

function cacheRows() {
    rows = $("tbody").children();
    cachedRows = makeSet(rows);
}

function revertToOriginalColor(element, origcolor, seconds) {
    var t = setTimeout(function() {
        element.style.backgroundColor = origcolor;
    },(seconds*1000));    
}

function highlightFor(cls,color,seconds) {
    var elements = document.getElementsByClassName(cls);
    for (i = 0; i < elements.length; i++) {
        var origcolor = elements[i].style.backgroundColor
        elements[i].style.backgroundColor = color;
        revertToOriginalColor(elements[i], origcolor, seconds);
    }
}

function fetchData() {
    console.log("Calling fetchData");
    $.ajax({
        type: 'GET',
        url: document.URL,
        async: true,
        dataType: 'html',
        success: function (pageHtml) {

            var el = document.createElement('html');
            el.innerHTML = pageHtml;
            newRows = el.getElementsByTagName('tbody')[0].children;
            cachedRowsNew = makeSet(newRows);
            
            tbodyHtml = '';
            for (i = 0; i < newRows.length; i++) {
                if (!cachedRows.has(newRows[i].innerHTML)) {
                    newRows[i].classList.add(MYCLASS);
                }
                tbodyHtml += newRows[i].outerHTML;
            }

            el.getElementsByTagName('tbody')[0].innerHTML = tbodyHtml;
            document.getElementsByTagName('body')[0].innerHTML = el.getElementsByTagName('body')[0].innerHTML;
            highlightFor(MYCLASS, 'green', 0.2);
            cachedRows = cachedRowsNew;
        }
    });
}

$(document).ready(function(){
    cacheRows();
    setInterval(fetchData, 10000);
    // fetchData();
});