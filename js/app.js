var apiString,
daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
val,
curSkycons = new Skycons({"color": "#2C3E50"}),
futureSkycons = new Skycons({"color": "#ECF0F1"}),
options = {
	enableHighAccuracy: false,
	timeout: 5000,
	maximumAge: 60000
};

function getFormattedTme(time) {
	var h = time.getHours();
	var m = "0" + time.getMinutes();
	if (h<12) {
		return h+":"+m.substr(-2)+"am";
	} else {
		return (h-12)+":"+m.substr(-2)+"pm";
	}
}

function setSizes() {
	windowWidth = $(window).width();
	wrapperWidth = $('.current-weather .panel-body').width();
	sidebarWidth = $('.sidebar').width();
	if (windowWidth >= 1024) {
		svgWidth = wrapperWidth - sidebarWidth - 31;
	} else {
		svgWidth = wrapperWidth;
	}
	svgHeight = svgWidth * 5/8;
}

function degToCompass(num) {
	val = Math.round((num/22.5)+.5);
	deg=["N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
	return deg[val];
}

$("#nav-search").submit(function(e) {

	e.preventDefault();
	
	var city = $(this).find('input').val();
	
	$.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address="+encodeURIComponent(city), function(val) {
		if(val.results.length) {
			// console.log(val.results);
			var location = val.results[0].geometry.location;
			getWeatherData(location.lat,location.lng, val.results[0].formatted_address);
		}
	});

	$(".weather-template").removeClass('hidden');
	
	$(".location-search").addClass('hidden');

});

$("#initial-search").submit(function(e) {

	e.preventDefault();
	
	var city = $(this).find('input').val();

	$.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address="+encodeURIComponent(city), function(val) {
		if(val.results.length) {
			// console.log(val.results);
			var location = val.results[0].geometry.location;
			getWeatherData(location.lat,location.lng, val.results[0].formatted_address);
		}
	});

	$(".weather-template").removeClass('hidden');

	$(".location-search").addClass('hidden');

});

function getWeatherData(lat, long, location) {
	apiString = "https://api.forecast.io/forecast/3a670cf4385dd059e4e5b960d8425fac/"+lat+","+long;

	$.getJSON(apiString + "?callback=?", function(response) {
		// console.log(response);
		parseData(response,location);
	});
}


function parseData(response,location){

	var todayWeather = response.daily.data.shift();

	renderText(response.currently,todayWeather,location);
	
	renderHourly(response.hourly.data);
	
	renderDaily(response.daily.data)

}

function renderText(cur,today,location){
	
	document.getElementById("location").innerHTML = location;

	document.getElementById("currWeather").innerHTML = cur.summary;

	document.getElementById("currWeather").innerHTML = cur.summary;
	
	document.getElementById("currTemp").innerHTML = Math.round(cur.apparentTemperature)+"&deg;";

	document.getElementById("todaySummary").innerHTML = today.summary;

	document.getElementById("maxTemp").innerHTML = Math.round(today.apparentTemperatureMax)+"&deg;";

	document.getElementById("maxTempTime").innerHTML = getFormattedTme( new Date(today.apparentTemperatureMaxTime*1000) );

	document.getElementById("minTemp").innerHTML = Math.round(today.apparentTemperatureMin)+"&deg;";

	document.getElementById("minTempTime").innerHTML = getFormattedTme( new Date(today.apparentTemperatureMinTime*1000) );
	
	document.getElementById("currWind").innerHTML = "Wind: " + Math.round(cur.windSpeed) + " mph (" + degToCompass(cur.windBearing) + ")";

	document.getElementById("sunset").innerHTML = getFormattedTme( new Date(today.sunsetTime*1000) );

	document.getElementById("sunrise").innerHTML = getFormattedTme( new Date(today.sunriseTime*1000) );

	curSkycons.set(document.getElementById("weatherIcon"),cur.icon);

	setSizes();
}

function renderDaily(data) {

	var dailyWeather = document.getElementById("daily-weather");
	
	dailyWeather.innerHTML = '<h1 class="text-uppercase">This Week</h1>';

	for(var i=0;i<data.length;i++){

		var div = document.createElement("div");

		var timeBase = new Date(data[i].time*1000);
		
		var dayName;

		var dayNum = timeBase.getDay();

		div.id = 'day'+dayNum;
		
		div.setAttribute("class", "upcomingDay clearfix");

		dayName = daysOfWeek[dayNum];

		div.innerHTML = "<p class='day-title h2'>" + dayName + "</p> <div class='clearfix'><canvas class='day-icon pull-left' id='weather-icon"+i+"' width='96' height='96'></canvas> <p class='day-temperature h3'>" + Math.round(data[i].temperatureMax) +"&deg; <span class='low'>" + Math.round(data[i].temperatureMin) +"&deg;</span> </p> <p class='day-summary'>" + data[i].summary + "</p></div>";

		var weatherIcon = data[i].icon;
		var weatherID = "weather-icon"+i;
		
		dailyWeather.appendChild(div);

		futureSkycons.set(weatherID, weatherIcon);
	}
	
	$('.upcomingDay').click(function() {
		alert($(this).attr('id'));
	});
}

function renderHourly(allData){

	d3.select('g').remove();
	
	// $('.today .panel-body').innerHTML = '<svg id="hourlyTemp"></svg>';

	var data = allData.slice(0, 25);

	var margin = {top: 75, right: 25, bottom: 75, left: 75};
	var height = svgHeight - margin.top - margin.bottom;
	var width = svgWidth - margin.left - margin.right;

	var svgSelection = d3.select('svg')
	.attr('height', svgHeight)
	.attr('width', svgWidth)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

	try {

		var parseDate = d3.time.format('%H %d %m %Y').parse;
		var dateFormat = d3.time.format('%-I %p');

		// var high = response.almanac.temp_high;
		// var low = response.almanac.temp_low;

		data.forEach(function(item) {

			// Create a new JavaScript Date object based on the timestamp
			// multiplied by 1000 so that the argument is in milliseconds, not seconds.
			var timeBase = new Date(item.time*1000);

			var hour = timeBase.getHours()
			var day = ("0"+timeBase.getDate()).substr(-2);
			var month = timeBase.getMonth()+1;
			var year = timeBase.getFullYear();

			var date = [hour, day, month, year].join(' ');

			item.parsedDate = parseDate(date);

			// console.log(date);

			// item.temperature = parseInt(item.temperature, 10);
		});

		var startDateBase = data[0].parsedDate.toString().split(" ");
		var endDateBase = data[(data.length-1)].parsedDate.toString().split(" ");
		var middleDateBase = data[ ( Math.round( data.length/2) ) ].parsedDate.toString().split(" ");
		
		var startDate = startDateBase[1] + ' ' + startDateBase[2];
		var endDate = endDateBase[1] + ' ' + endDateBase[2];
		var middleDate = middleDateBase[1] + ' ' + middleDateBase[2];
		
		// var endYear = endDateBase.year;

		var xRange = d3.extent(data, function(d) { return d.parsedDate; });

		//We need to find max and min temps for the hourly and the historical data.
		//First find max and min for hourly, then put values in array and find overall range.
		// var hourlyMax = d3.max(data, function(d) { return d.temperature });
		// var hourlyMin = d3.min(data, function(d) { return d.temperature });
		// var tempMaxMinArray = [hourlyMax, hourlyMin];
		var yRange = d3.extent(data, function(d) { return d.temperature; });
		//extend the range a bit to accommodate text labels on the record high/low lines
		yRange[0] -= 10;
		yRange[1] += 10;

	} catch(e) {
      //If there's a problem with the data, log out the error and print a message
      console.log(e);

      svgSelection.append('text')
      .attr('class', 'title')
      .attr('x', (width/2 - 13))
      .attr('y', (height/2))
      .attr('text-anchor', 'middle')
      .text('There is no hourly data for this location. Please try another.');
  }

    // if (yRange[0] > 0) {
    //   yRange[0] = 0;
    // }
    // if (yRange[1] < 90) {
    //   yRange[1] = 90;
    // }
    var xScale = d3.time.scale()
    .domain(xRange)
    .range([0, width]);
    var yScale = d3.scale.linear()
    .domain(yRange).nice() 
    .range([height, 0]);

    //Define and add hourly temperature as a line 
    var line = d3.svg.line()
    .interpolate('basis')
    .x(function(d) { return xScale(d.parsedDate); })
    .y(function(d) { return yScale(d.temperature); });

    function make_x_axis(x) {
    	return d3.svg.axis()
    	.scale(xScale)
    	.orient("bottom")
    	.ticks(12)
    }

	// function for the y grid lines
	function make_y_axis(y) {
		return d3.svg.axis()
		.scale(yScale)
		.orient("left")
		.ticks(8)
	}

      // Draw the x Grid lines
      svgSelection.append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(make_x_axis()
      	.tickSize(-height, 0, 0)
      	.tickFormat("")
      	)

    // Draw the y Grid lines
    svgSelection.append("g")            
    .attr("class", "grid")
    .call(make_y_axis()
    	.tickSize(-width, 0, 0)
    	.tickFormat("")
    	)

    //Add x and y axis
    var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom')
    .ticks(d3.time.hours(xRange[0], xRange[1]).length)
    .tickFormat(dateFormat)
    .tickSize(10,1)
    .ticks(12);

    var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left')
    .tickSize(10,1)
    .ticks(8);

    svgSelection.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(xAxis);

    svgSelection.append('g')
    .attr('class', 'axis')
    .call(yAxis);

    svgSelection.append('path')
    .datum(data)
    .attr('class', 'line')
    .attr('d', line);

    //Add title and label text
    svgSelection.append('text')
    .attr('class', 'title')
    .attr('x', (width/2)-25)
    .attr('y', 0 - (margin.top/2))
    .attr('dy', '10')
    .attr('text-anchor', 'middle')
    .text('Hourly Temperatures');

    svgSelection.append('text')
    .attr('class', 'label')
    .attr('x', 0)
    .attr('y', height + margin.bottom/2)
    .attr('dy', '16')
    .attr('text-anchor', 'left')  
    .text(startDate);

    svgSelection.append('text')
    .attr('class', 'label')
    .attr('x', width)
    .attr('y', height + margin.bottom/2)
    .attr('dy', '16')
    .attr('text-anchor', 'end')  
    .text(endDate);

    svgSelection.append('text')
    .attr('class', 'label')
    .attr('x', width/2)
    .attr('y', height + margin.bottom/2)
    .attr('dy', '16')
    .attr('text-anchor', 'middle')  
    .text(middleDate);

    svgSelection.append('text')
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left/2)
    .attr('x', 0 - height/2)
    .attr('dy', '-6')
    .attr('text-anchor', 'middle')  
    .text('Temperature °F');
}



curSkycons.play();
futureSkycons.play();



// navigator.geolocation.getCurrentPosition(success, error, options);