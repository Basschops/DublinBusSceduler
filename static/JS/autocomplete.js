
// FUNCTION TO PROVIDE AUTOFILL ON LOCATION SEARCHES

$( window ).on ("load", function () {

    //set the autocomplete callback for destination autosuggest powered by directions api


    //==================================================================================================================
$("#destination").each(function(){     //#location_from,#location_to,
    $(this).autocomplete({
        source: function(request, response){
            var availableTags = [];

            var to_input = request.term; //This is the user input

            $.getJSON( "/autocomp" + "?format=json&operator=bac&stopname="+to_input, function(data) {

                _.forEach(data.results, function(busStops){
                    availableTags.push({ label: busStops.fullname+" "+busStops.stopid, value: busStops.latitude+","+busStops.longitude });
                });
                response(availableTags);

            }).done(function(){
                //
            }).fail(function(){
                alert("failed autosuggest");
            }).always(function(){
                //
            });
        },
        minLength: 3 //Number of characters after which the autosuggest should start...
    });
});

    //==================================================================================================================

    // Set the autocomplete for bus routes from GTFS routes file
    $( "#bus_number" ).autocomplete({
        source: function(request, response){
            var availableTags = [];

            var bus_num_input = request.term; //This is the user input

            $.getJSON( "/autocomp/routes", function(data) {

                _.forEach(data, function(busRoute){

                    // Only add busRoute as tag if it starts with input
                    if (busRoute.startsWith(bus_num_input)) {
                        availableTags.push({label: busRoute, value: busRoute});
                    }
                });
                response(availableTags);

            }).done(function(){
                //
            }).fail(function(){
                alert("failed autosuggest");
            }).always(function(){
                //
            });
        },
        minLength: 1 //Number of characters after which the autosuggest should start...
    });

    //==================================================================================================================

    // Set the autocomplete for start stop form input
    $( "#location_from" ).autocomplete({
        source: function(request, response){
            var busNumberInput = $("#bus_number").val().toUpperCase();  // Bus route input determines stop to suggest

            var availableTags = [];

            var to_input = request.term; //This is the user input

            var routeList = [];  // To store all routes of a stop in loop below

            var routeCheck = -1; // To check if input route is in routeList using indexing

            $.getJSON( "/autocomp" + "?format=json&operator=bac&stopname="+to_input, function(data) {

                _.forEach(data.results, function(busStops){

                    routeList = busStops.operators[0].routes;
                    routeCheck = routeList.indexOf(busNumberInput);

                    if ( busNumberInput === "" ) {
                        availableTags.push({label: busStops.fullname + " " + busStops.stopid, value: busStops.stopid});

                    } else if ( routeCheck !== -1 ) {
                        availableTags.push({label: busStops.fullname + " " + busStops.stopid, value: busStops.stopid});
                    }
                });
                response(availableTags);

            }).done(function(){
                //
            }).fail(function(){
                alert("failed autosuggest");
            }).always(function(){
                //
            });
        },
        minLength: 1 //Number of characters after which the autosuggest should start...
    });

    //==================================================================================================================

    // Set the autocomplete for destination stop form input
    $( "#location_to" ).autocomplete({
        source: function(request, response){
            var busNumberInput = $("#bus_number").val().toUpperCase();  // Bus route input determines stop to suggest

            var availableTags = [];

            var to_input = request.term; //This is the user input

            var routeList = [];  // To store all routes of a stop in loop below

            var routeCheck = -1; // To check if input route is in routeList using indexing

            $.getJSON( "/autocomp" + "?format=json&operator=bac&stopname="+to_input, function(data) {

                _.forEach(data.results, function(busStops){

                    routeList = busStops.operators[0].routes;
                    routeCheck = routeList.indexOf(busNumberInput);

                    if ( busNumberInput === "" ) {
                        availableTags.push({label: busStops.fullname + " " + busStops.stopid, value: busStops.stopid});

                    } else if ( routeCheck !== -1 ) {
                        availableTags.push({label: busStops.fullname + " " + busStops.stopid, value: busStops.stopid});
                    }
                });
                response(availableTags);

            }).done(function(){
                //
            }).fail(function(){
                alert("failed autosuggest");
            }).always(function(){
                //
            });
        },
        minLength: 1 //Number of characters after which the autosuggest should start...
    });

});
