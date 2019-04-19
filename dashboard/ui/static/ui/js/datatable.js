/*
1. Include ui/utils.js before loading this.
*/
$(document).ready(function(){

    //  1. obtain API endpoint that fetches data.
    var endpoint = document.URL.replace('ui', 'api');

    //  2. get JSON data.
    $.get(endpoint).then((data) => {
        
        //  3. if no data received, return.
        if (data.length == 0) {
            $('#example').html("<center><h4> No entries for the given set of filters </h4><center>");
        }
        else {

            var table = createDataTable('#example', data, false, {
                "columnDefs": [
                    { 
                        "targets": ["channel_value", "stage_number"],
                        "visible": false
                    },
                    {
                        "targets": "video_path",
                        "render": function ( data, type, row, meta ) {
                                    if (data == "NULL") {
                                        return data;
                                    }
                                    else {
                                        return '<a href="'+ data.replace("gs://", "https://storage.cloud.google.com/") + '">Stream</a>';
                                    }
                        }
                    }
                ]
            });
        }
    });
});