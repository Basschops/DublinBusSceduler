'use strict';

var map;
var markers = []; //Create an array of markers for the marker cluster function
var Shopmarkers = []; // Arrays for each type of destination
var travelmarkers = [];
var activitiesmarkers = [];
var outdoorsmarkers = [];
var familymarkers = [];
var sightsmarkers = [];
// Create one object that contains all tourist markers
var markerslists = [travelmarkers, Shopmarkers , activitiesmarkers , sightsmarkers,  familymarkers, outdoorsmarkers ];
var userMarker; //User marker handle
var boxeschecked; //global var to count number of boxes checked in explore

//Loads the map
function initMap(){
    var mapDiv = document.getElementById("map");
    var mapOptions = {
        center: new google.maps.LatLng(53.3498, -6.2603),
        zoom: 14
    };

    map = new google.maps.Map(mapDiv, mapOptions);
}


//Makes a marker for busstops and add onlick functionality
function addMarkers(latlong, color = "red", infowindow, infowindow_content, stopid, isUser = false){
  //create a marker
    var marker = new google.maps.Marker({
        position: latlong,
        title: "Bus Stop No. " + stopid,
        draggable: false,
        map: map,
        icon: 'http://maps.gstatic.com/mapfiles/ridefinder-images/mm_20_'+ color +'.png'
    });
    

    //Add the pop up box to marker for onclick
    google.maps.event.addListener(marker, 'click', function(content){
        infowindow.setContent(infowindow_content);
        infowindow.open(map, marker);
    });

    //special cases
    if (isUser === false){
      markers.push(marker); //Create an array of markers for the marker cluster function
    } else {
      marker.title = stopid; //This will just display the isUser string "You Are Here" instead of bus stop number
      marker.setAnimation(google.maps.Animation.BOUNCE);
      marker.icon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
      userMarker = marker;
    }
}


// Function to create explorer markers (Tourist information)
function addExMarkers(latlong, attraction, type , icon, infowindow, infowindow_content){
  //create a marker

    var marker = new google.maps.Marker({
        position: latlong,
        title: attraction,
        draggable: false,
        map: map,
        icon: icon
    });
    // Keep track of the different groups of markers
    markerslists[type].push(marker);

    //Add the pop up box to marker for onclick
   google.maps.event.addListener(marker, 'click', function(content){
       infowindow.setContent(infowindow_content);
       infowindow.open(map, marker);
   });

}


// Fucntion to show groups of destinations at a time
function showDestinations(destinations, type, icon){
    // Set up info window for each type
    var infowindow = new google.maps.InfoWindow();
    for (var i = 0 ; i < destinations.length ; i++){
        var latlon = {lat: destinations[i][1], lng: destinations[i][2]};
        let infowindow_content = "<b>"+destinations[i][0]+"</b>";
        //Create markers
        addExMarkers(latlon, destinations[i][0], type, icon,infowindow, infowindow_content);

        }
    }



//makes the markers invisible by calling this function like setMapForMarkers(some_marker_array, null);
function setMapForMarkers(markerArray, map){
  for (let i = 0; i < markerArray.length; i++){
    markerArray[i].setMap(map);
  }
}


//makes markers invisible and deletes them
function deleteMarkers(markerArray){
  setMapForMarkers(markerArray, null); //Hide all the markers first
  markerArray = [] //Remove references to the markers to delete them
}


//Responds to onclick event when from button is clicked on a marker
function fromButton(element){
    document.getElementById('location_from').value = element.id.slice(5); //Populate a form field
}


//Responds to onclick event when to button is clicked on a marker
function toButton(element){
    document.getElementById('location_to').value = element.id.slice(3); //Populate a form field
}


//Populate the map with information & markers
$( window ).on( "load", function() { //When DOM & other resources all loaded and ready...
    var infowindow = new google.maps.InfoWindow(); //Common infowindow handle for all infowindows

    var errorMSG_1 = document.getElementById("error_message_1"); //FOR DEBUGGING
    var errorMSG_2 = document.getElementById("error_message_2"); //FOR DEBUGGING
    var userPosition = {lat: 53.3498, lng: -6.2603}; //Will be center of Dublin by default if no isUser position recieved later on...

    //Get the isUser location
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(gotPosition, failedToGetPosition);
    } else { 
      //
    }


    function gotPosition(position) { //success
      userPosition = showUserPosition(position);
    }


    function failedToGetPosition(error){
      //Warn the user
      $("#location_alert").css({"display" : "block"});
    }

    // Set up google places autocomplete for inputs in Explorer persona
    var autocompleteFrom = new google.maps.places.Autocomplete(document.getElementById('location_from_ex'), {componentRestrictions: {country: 'ie'}});
    var autocompleteTo = new google.maps.places.Autocomplete(document.getElementById('location_to_ex'), {componentRestrictions: {country: 'ie'}});

    autocompleteFrom.bindTo('bounds', map);
    autocompleteTo.bindTo('bounds', map);

    autocompleteFrom.addListener('place_changed', function() {
        var place = autocompleteFrom.getPlace();
    });
    autocompleteTo.addListener('place_changed', function() {
        var place = autocompleteTo.getPlace();
    });

    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    //Function to process and display directions on map

    function calculateDirections(origin, destination, date_time) {
        directionsDisplay.set('directions', null);

        var request = {
            origin: origin,
            destination: destination,
            travelMode: 'TRANSIT',
            transitOptions: {
                departureTime: new Date(date_time),
                modes: ['BUS'],
                routingPreference: 'FEWER_TRANSFERS'
            },
        }

        directionsDisplay.setMap(map);
        directionsService.route(request, function (result, status) {

            if (status == 'OK') {
                directionsDisplay.setDirections(result);
            } else if (status == 'NOT_FOUND') {
                //
            } else if (status == 'ZERO_RESULTS') {
                //
            } else {
                //
            }
        });
    }

    // Function to place users location on map
    function showUserPosition(position){
      //Converts isUser position from geolocation coords to {lat: xxx, lng: xxx}
      //and add the a marker to the map.

      //returns converted isUser position
      let userPosition = {}
      userPosition.lat = position.coords.latitude;
      userPosition.lng = position.coords.longitude;

      let infowindow_content = "<b>You Are Here</b>";

      addMarkers(new google.maps.LatLng(userPosition.lat, userPosition.lng), "red", infowindow, infowindow_content, "You Are Here", true);
      map.panTo({lat: userPosition.lat, lng: userPosition.lng});

      return userPosition
    }

    // Displays the bustops around a user within a certain range
    function displayBusStopMarkersAtLocation(coords = {lat: 53.3498, lng: -6.2603}, radius = 0.01){
      //populate the markers around the isUser
      $.getJSON("/busstops", function(busData){

          _.forEach(busData.results, function(bus_stop){

              if (bus_stop.latitude < (coords.lat + radius) && bus_stop.latitude > (coords.lat - radius)
              && bus_stop.longitude < (coords.lng + radius) && bus_stop.longitude > (coords.lng - radius)){
                let infowindow_content = "<b>Bus Stop No: </b>"+bus_stop.stopid
                                    +"<br><br>"
                                    +"<b>Name:</b> "+bus_stop.fullname
                                    +"<br><br>"
                                    +"<b>Routes serving this stop:</b>"
                                    +"<br><br>"+bus_stop.operators[0].routes
                                    +"<br><br>"
                                    +"<button type=\"button\" id=\"from_"+bus_stop.stopid+"\" onclick=\"fromButton(this)\">From "+bus_stop.stopid+"</button>"
                                    +"<br><br>"
                                    +"<button type=\"button\" id=\"to_"+bus_stop.stopid+"\" onclick=\"toButton(this)\">To "+bus_stop.stopid+"</button>";

                addMarkers(new google.maps.LatLng(bus_stop.latitude, bus_stop.longitude), "blue", infowindow, infowindow_content, bus_stop.stopid);
              }
        });

      }).done(function() {
        //
      }).fail(function() {
        //
      }).always(function(){
        //
      });
    }

    function displayDirectionMarkers(from, to){
      //check if input is string or object and convert to string if needed
      let origin = typeof from === "string" ? from : from.lat+","+from.lng;
      let destination = typeof to === "string" ? to : to.lat+","+to.lng;

      $.getJSON("/directions" 
                + "?origin="+origin
                +"&destination="+destination
                +"&mode="+"transit"
                +"&transit_mode="+"bus", function(directionsData){

        let index = 0; //keep track of which step along the route we are on...
        let markerColor = "blue"; //Blue is bus, Yellow is walking, Red is the user starting location.

        _.forEach(directionsData.routes[0].legs[0].steps, function(step){
          index++;

          if (step.travel_mode === "TRANSIT") { //must be bus...
            markerColor = "blue";

            var infowindow_content = "<b>["+index+"]Take a: </b>"+step.html_instructions
                                    +"<br><br>"
                                    +"<b>Stop Name:</b> "+step.transit_details.departure_stop.name
                                    +"<br><br>"
                                    +"<b>Routes serving this stop:</b>"
                                    +"<br><br>"+step.transit_details.line.short_name
                                    +"<br><br>";
          } else { //must be walking...
            markerColor = "yellow";
            var infowindow_content = "<b>["+index+"]On foot: </b>"+step.html_instructions;
          }
          if (index == 1) { //First marker is the user starting location, make it red & remove the initial user marker...
            markerColor = "red";
            deleteMarkers([userMarker]);
          } else { //2nd and further markers are directional waypoints - make them yellow...
            //
          }

          //Add route markers
          addMarkers(new google.maps.LatLng(step.start_location), markerColor, infowindow, infowindow_content, step.html_instructions);

        });

        //Add the destination marker
        index++; //This is the number of the final step (i.e. destination)
        //Create and parse a latitude, longitude object for the marker
        let to_obj = {}
        to_obj.lat = parseFloat(to.split(',')[0]);
        to_obj.lng = parseFloat(to.split(',')[1]);
        markerColor = "red";
        var infowindow_content = "<b>["+index+"]Destination</b>";
        addMarkers(new google.maps.LatLng(to_obj), markerColor, infowindow, infowindow_content, "");

      }).done(function(){
        //
      }).fail(function(){
        //
      }).always(function(){
        //...
      });
    }

    //Displaying routes on MAP based on user input
     var bus_route_input = document.getElementById("bus_number");
     if (bus_route_input !== null) {
        bus_route_input.addEventListener("blur", function() {
            //Remove exisiting busroute markers.... AND Local markers from function displayBusStopMarkersAtLocation
            deleteMarkers(markers)
            displayBusStopMarkersForRoute(bus_route_input.value);
        });
     }

    // Display the stops along a route on the map
    function displayBusStopMarkersForRoute(route){
        //populate the markers for an input route
        $.getJSON("/routeinfo"
                    + "?format="+'json'
                    +"&operator="+'bac'
                    +"&routeid="+route, function(busData){

            var lastLargestSubRoute = 0;
            _.forEach(busData.results, function(bus_route){

                //First pass, keep track of largest sub route
                if (bus_route.stops.length > lastLargestSubRoute) {
                    lastLargestSubRoute = bus_route.stops.length;
                }
          });

          _.forEach(busData.results, function(bus_route){

            //Second pass display the largest sub route only
            if (bus_route.stops.length == lastLargestSubRoute) {
                _.forEach(bus_route.stops, function(bus_stop){
                    let infowindow_content = "<b>Bus Stop No: </b>"+bus_stop.stopid
                                    +"<br><br>"
                                    +"<b>Name:</b> "+bus_stop.fullname
                                    +"<br><br>"
                                    +"<b>Routes serving this stop:</b>"
                                    +"<br><br>"+bus_stop.operators[0].routes
                                    +"<br><br>"
                                    +"<button type=\"button\" id=\"from_"+bus_stop.stopid+"\" onclick=\"fromButton(this)\">From "+bus_stop.stopid+"</button>"
                                    +"<br><br>"
                                    +"<button type=\"button\" id=\"to_"+bus_stop.stopid+"\" onclick=\"toButton(this)\">To "+bus_stop.stopid+"</button>";

                    addMarkers(new google.maps.LatLng(bus_stop.latitude, bus_stop.longitude), "blue", infowindow, infowindow_content, bus_stop.stopid);

                    var bounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < markers.length; i++) {
                        bounds.extend(markers[i].getPosition());
                    }

                    map.setCenter(bounds.getCenter());
                    map.fitBounds(bounds);
                })
            }
      });
  
        }).done(function() {
            //
        }).fail(function() {
            //
        }).always(function(){
            //
        });
      }

    //set the directions button callback...
    $( '#exButton' ).click(function(){

        let origin = $('#location_from_ex').val();
        let destination = $('#location_to_ex').val();

        let date = $('#datepicker_ex').val();
        let time = $('#clockpicker_ex').val();

        // Convert date and time to timestamp
        var date_time = new Date (date + " " + time).getTime();

        calculateDirections(origin, destination, date_time); //show the new direction marker//
    });


    //set the directions button callback...
    $( '#directionsButton' ).click(function(){
      deleteMarkers(markers); //clear current direction markers

      let destination = $('#destination').val();
      displayDirectionMarkers(userPosition, destination); //show the new direction markers
    });
    

    // Functions to add explorer icons based on checkboxes
    $( '#ShoppingCheck' ).click(function(){
        var icon = 'http://labs.google.com/ridefinder/images/mm_20_gray.png';

        if (document.getElementById("ShoppingCheck").checked) {
            showDestinations(Shopping, 1, icon);
        }
        else {
            deleteMarkers(markerslists[1]);
        }
        });

    $( '#TravelLinksCheck' ).click(function(){
        var icon = 'http://labs.google.com/ridefinder/images/mm_20_green.png';

        if (document.getElementById("TravelLinksCheck").checked) {
            showDestinations(travel_links, 0, icon);
        }
        else {
            deleteMarkers(markerslists[0]);
        }
        });

    $( '#ActivitiesCheck' ).click(function(){
        var icon = 'http://labs.google.com/ridefinder/images/mm_20_orange.png';

        if (document.getElementById("ActivitiesCheck").checked) {
            showDestinations(Activities, 2, icon);
        }
        else {
            deleteMarkers(markerslists[2]);
        }
        });

    $( '#SightsCheck' ).click(function(){
        var icon = 'http://labs.google.com/ridefinder/images/mm_20_purple.png';

        if (document.getElementById("SightsCheck").checked) {
            showDestinations(SightSeeing, 3, icon);
        }
        else {
            deleteMarkers(markerslists[3]);
        }
        });

     $( '#FamilyCheck' ).click(function(){
         var icon = 'http://labs.google.com/ridefinder/images/mm_20_black.png';

        if (document.getElementById("FamilyCheck").checked) {
            showDestinations(Family, 4, icon);
        }
        else {
            deleteMarkers(markerslists[4]);
        }
        });

    $( '#OutdoorsCheck' ).click(function(){
        var icon = 'http://labs.google.com/ridefinder/images/mm_20_white.png';

        if (document.getElementById("OutdoorsCheck").checked) {
            showDestinations(Outdoors, 5, icon);
        }
        else {
            deleteMarkers(markerslists[5]);
        }
        });

});


// Explorer map point information
var travel_links = [
       ['Dublin Airport', 53.4264513, -6.2521038],
       ['Europecar Dublin City', 53.3484939, -6.2400041],
       ['St Stephen\'s Green Luas', 53.3391899, -6.2635223],
       ['Dublin Connolly Station', 53.351829, -6.2517332],
       ['Aircoach O\'Connell Street', 53.3517839, -6.2633345]
   ];
var Shopping = [
       ['Grafton Street', 53.3421532, -6.2620394],
       ['Henry Street', 53.3493502, -6.2652141],
       ['Dundrum Shopping Centre', 53.2874809, -6.2438303],
       ['St Stephen\'s Green Shopping Centre', 53.3399155, -6.26479],
       ['Powerscourt Townhouse Centre', 53.3422148, -6.2639623],
       ['O\'Connell Street', 53.3512448, -6.2629729]
   ];

var Activities = [
       ['AdventureRooms Dublin', 53.3494134, -6.2721929],
       ['Incognito Escape Room', 53.3434981, -6.2833655],
       ['Escape Boats', 53.3413279, -6.2411257],
       ['Hop on Hop Off', 53.3505611, -6.2631577],
       ['GoQuest Indoor Challenge Zone', 53.4007191, -6.3176467]
   ];
var SightSeeing = [
       ['Trinity College Dublin', 53.3517996, -6.2699275],
       ['Guinness Storehouse', 53.3418772, -6.2889033],
       ['St. Patrick\'s Cathedral', 53.3395186, -6.2736707],
       ['Temple Bar', 53.3454388, -6.2690681],
       ['Dublin Castle', 53.3428893, -6/2696224],
       ['Christ Church Cathedral', 53.3435162, -6.2732542],
       ['St Stephen\'s Green', 53.3369012, -6.2619592],
       ['City Hall', 53.3438672, -6.269369]
   ];
var Family = [
       ['Dublin Zoo Phoenix Park', 53.3561967, -6.3074838],
       ['The Ark - Temple Bar', 53.3449479, -6.2672568],
       ['Viking Splash Tours', 53.3392812, -6.260881, 3],
       ['Imaginosity, Dublin Children\'s Museum', 53.2774382, -6.2187599],
       ['The Chocolate Warehouse, Dublin', 53.3148733, -6.3343803]
   ];
var Outdoors = [
       ['Phoenix Park', 53.3558855, -6.3320073],
       ['National Botanic Gardens', 53.3725525, -6.274101],
       ['Howth', 53.3776565, -6.200751],
       ['Graystones', 53.1450113, -6.150619],
       ['Sandymount Strand', 53.3305784, -6.2332952]
   ];
