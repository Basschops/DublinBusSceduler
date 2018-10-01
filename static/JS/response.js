$( window ).on( "load", function() {


    //_________________________________________ONTHEGO
    $( "#onthego_form" ).on('submit', function(event){
        event.preventDefault();
        createResponseOnTheGo();
    });

    function createResponseOnTheGo(){
        $.ajax({
            url: "/onthego/formdata",
            type: "GET",
            data: { busnum_var : $('#bus_number').val(),
                    from_var : $('#location_from').val(),
                    to_var : $('#location_to').val() },

            success: function(response) {
                document.getElementById('response').innerHTML = response; //more efficient than using jQuery equivalent...
                document.getElementById('response').scrollIntoView();
            },

            error: function(xhr, errmsg, err) {
                //
            }
        });
    }

    //_________________________________________PLANNER/ACCESIBILITY

    $( "#planner_form" ).on('submit', function(event){
        event.preventDefault();
        createResponsePlanner();
    });

    function createResponsePlanner(){

        $.ajax({
            url: "/planner/formdata",
            type: "GET",
            data: { busnum_var : $('#bus_number').val(),
                    from_var : $('#location_from').val(),
                    to_var : $('#location_to').val(),
                    date_var : $('#datepicker').val(),
                    time_var : $('#clockpicker').val() },

            success: function(response) {
                document.getElementById('response').innerHTML = response; //more efficient than using jQuery equivalent...
                document.getElementById('response').scrollIntoView();
            },

            error: function(xhr, errmsg, err) {
                //
            }
        });
    }

    //_________________________________________EXPLORER

    $( "#explorer_form" ).on('submit', function(event){
        event.preventDefault();
        createResponseExplorer();
    });

    function createResponseExplorer(){

        $.ajax({
            url: "/tourist/formdata",
            type: "GET",
            data: { from_var_ex : $('#location_from_ex').val(),
                    to_var_ex : $('#location_to_ex').val(),
                    date_var_ex : $('#datepicker_ex').val(),
                    time_var_ex : $('#clockpicker_ex').val() },

            success: function(response) {
                document.getElementById('response').innerHTML = response; //more efficient than using jQuery equivalent...
                document.getElementById('response').scrollIntoView();
            },

            error: function(xhr, errmsg, err) {
                //
            }
        });
    }

});