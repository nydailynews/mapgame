var mapg = {
    init: function()
    {
        // Config handling. External config objects must be named mapg_config
        if ( typeof window.mapg_config !== 'undefined' )
        {
            this.update_config(mapg_config);
        }
        this.slug = this.build_slug();
        this.map = new google.maps.Map(document.getElementById('map-canvas'), this.mapOptions);

        if ( is_mobile == true )
        {
            this.load_handheld();
        }
        else
        {
            // DESKTOP ISH
            answer_marker = new google.maps.Marker(
            {
                position: this.config.markerlatlng,
                map: this.map,
                draggable: true,
                title: 'Your Guess'
            });

            google.maps.event.addListener(window.answer_marker, 'mouseup', function(guess) { window.mapg.make_guess_desktop(guess); });
        }

        // If we start with a loaded boundary, load it
        if ( this.config.border_file !== '' )
        {
            var geoxml_config = {
                map: this.map,
                processStyles: true,
                zoom: false,
                createOverlay: this.create_overlay,
                createMarker: this.create_marker
            };
            var kml_parser = new geoXML3.parser(geoxml_config);
            kml_parser.parse(this.config.border_file);
        }
    },
    load_handheld: function()
    {
        // Handheld devices use a different interface than desktop.
        var action_long = 'Pan the map and bring the crosshairs over';
        var action_short = 'click the button';
        document.getElementById('first-action').textContent = action_long;
        document.getElementById('second-action').textContent = action_long;
        document.getElementById('final-action').textContent = action_short;
        
        // Create mobile map crosshairs overlay
        var img = document.createElement('img');
        img.setAttribute('id', 'crosshairs')
        img.src = '../img/map-crosshairs.png';
        img.setAttribute('alt', 'image of red crosshairs')
        var src = document.getElementById('interface');
        src.appendChild(img);

        // Create button for mobile map interaction
        var submit_text = 'Submit guess';
        var btn = document.createElement('button');
        btn.setAttribute('id', 'submit-button')
        btn.setAttribute('onClick', 'mapg.make_guess_handheld();');
        btn.innerHTML = submit_text;
        var btnplc = document.getElementById('intro');
        btnplc.appendChild(btn);
        
        // Put the button below the map too
        var btn = document.createElement('button');
        btn.setAttribute('id', 'bottom-submit');
        btn.setAttribute('onClick', 'mapg.make_guess_handheld();');
        btn.innerHTML = submit_text;
        btnplc = document.getElementById('interface');
        btnplc.appendChild(btn);
    },
    parent: this,
    in_dev: 0,
    config: 
    { 
        snark: 1,
        percent: '%',
        group_game: 1,
        log_guesses: 0,
        log_url: '',
        target_name: '',
        target_slug: '',
        target_type: 'latlng',
        boundary_file: '',
        border_file: '',
        unit: 'miles', // miles or km
        zoom: 6,
        answer_fuzz: 0, // Number of miles the guess can be off by and still count as correct
        radius: 0,
        target: new google.maps.LatLng(27.175015 , 78.042155),
        centerlatlng: new google.maps.LatLng(0, 0),
        markerlatlng: 0
    },
    update_config: function(config) {
        // Take an external config object and update this config object.
        for ( var key in config )
        {
            if ( config.hasOwnProperty(key) )
            {
                this.config[key] = config[key];
            }
        }

        // Zoom and center are something that goes in the mapg.mapOptions object,
        // so we update that separately.
        this.mapOptions.zoom = this.config.zoom;
        // Older maps only have centerlatlng -- separating centerlatlng from the markerlatlng
        // gives us more flexibility on where we put the marker.
        if ( this.config.markerlatlng === 0 )
        {
            this.config.markerlatlng = this.config.centerlatlng;
        }

        this.mapOptions.center = this.config.centerlatlng;

        if ( typeof this.config.styles !== 'undefined' )
        {
            this.mapOptions.styles = this.config.styles;
        }
    },
    mapOptions: 
    {
        zoom: 8,
        center: new google.maps.LatLng(0, 0),
        disableDefaultUI: false,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDoubleClickZoom: true,
        draggable: true,
        streetViewControl: false,
        scrollwheel: false,
        styles: [
          {
            "featureType": "road",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "administrative.locality",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "administrative.province",
            "elementType": "labels",
            "stylers": [
              { "visibility": "off" }
            ]
          }
        ]
    },
    slugify: function(str)
    {
        // Cribbed from https://github.com/andrefarzat/slugify/blob/master/slugify.js
        var from = 'àáäãâèéëêìíïîòóöôõùúüûñç·/_,:;',
        to = 'aaaaaeeeeiiiiooooouuuunc------';

        var i = 0,
            len = from.length;
        
        str = str.toLowerCase();

        for ( ; i < len; i++ )
        {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        return str.replace(/^\s+|\s+$/g, '') //trim
            .replace(/[^-a-zA-Z0-9\s]+/ig, '')
            .replace(/\s/gi, "-");
    },
    build_slug: function()
    {
        // Put together the slug of a map -- a name we can refer to.
        //return this.slugify(this.config.target_name) + '_' + this.config.unit;
        return this.slugify(this.config.target_name);
    },
    slug: '',
    build_tweet: function(link_text, tweet_text) {
        // Return markup suitable for creating a link to tweet something.
        // Markup will generally look like: <a target="_blank" href="https://twitter.com/intent/tweet?text=Here's something cool&url=http://interactive.nydailynews.com/&via=NYDNi&related=nydailynews,NYDNi">Tweet</a>
        var tt = tweet_text.replace(/ /g, '%20');
        var url = document.location.href;
        return ' <a target="_blank" href="https://twitter.com/intent/tweet?text=' + tt + '&url=' + url + '&via=NYDNi&related=nydailynews,NYDNi">' + link_text + '</a>';
    },
    log_answer: function(distance, lat, lon)
    {
        // Reload ads, analytics
        if ( typeof googletag !== 'undefined' ) googletag.pubads().refresh();
        if ( typeof PARSELY !== 'undefined' && typeof PARSELY.beacon !== 'undefined' ) PARSELY.beacon.trackPageView({ url: document.location.href, urlref: document.location.href, js: 1 });

        // Send a request to a remote server to log how far the guess was from the mark
        if ( this.config.log_guesses !== 0 )
        {
            var params = '?slug=' + this.config.target_slug + '&distance=' + distance + '&lat=' + lat + '&lon=' + lon + '&callback=';
            var jqxhr = $.getJSON( this.config.log_url + params, function(data) 
            {
                // Success
                // Display how the reader has done compared to everyone else.
                // **TODO provide a link so they can see everyone else's guesses.
                // data will look something like { "guesses": "1", "average": "8" }

                // Scroll to the result.
                $('html, body').animate({
                    scrollTop: $("#result").offset().top
                }, 2000);

                var average = Math.round(data.average);
                if ( average < 5 ) average = Math.round(data.average*10) / 10;

                var s = 's';
                if ( average === 1 ) s = '';
                $('#result').append(' ' + data.guesses + ' other people have played. An average guess landed ' + average + ' mile' + s + ' away.');
                if  ( typeof data.correct !== 'undefined' )
                {
                    var people = "people";
                    if ( data.correct == 1 ) people = "person";

                    var percent_right = Math.round(data.correct/data.guesses*1000)/10;
                    if ( data.guesses == 0 ) percent = 0;

                    var how_many_right_tweet = mapg.build_tweet('tweet this', percent_right + mapg.config.percent + ' of people playing the ' + mapg.config.target_name + ' map quiz knew where ' + mapg.config.target_name + ' was on the map.');
                    $('#result').append(' ' + data.correct + ' ' + people + ' (' + percent_right + mapg.config.percent + ') picked right (' + how_many_right_tweet + ').');

                    // Calculate the percent of people they did worse / better than.
                    var esses = "es";
                    if ( data.worse_than == 1 ) esses = "";
                    percent_further = Math.round(data.worse_than/data.guesses*1000)/10;
                    percent_better = Math.round((100 - percent_right)*10)/10;
                    var better_than = data.guesses - data.correct;

                    // If they didn't do worse than anyone, we give them a
                    // positive message of accomplishment
                    if ( data.worse_than == 0 )
                    {
                        if ( better_than == 1 ) esses = "";
                        $('#result').append('<br><br>Your guess was closer than ' + better_than + ' other guess' + esses + '. That means you did better than ' + percent_better + ' ' + mapg.config.percent + ' of the people who played this, and tied the other ' + percent_right + mapg.config.percent + '.');
                    }
                    else
                    {
                        $('#result').append('<br><br>Your guess was further away than ' + data.worse_than + ' other guess' + esses + '. That means you did worse than ' + percent_further + mapg.config.percent + ' of the people who played this.');
                    }
                    var tweet_text = 'I did better than ' + percent_better + mapg.config.percent + ' of the people who played this ' + mapg.config.target_name + ' map quiz:';
                    $('#result').append(mapg.build_tweet('Tweet this', tweet_text) + '.');

                    if ( distance == 0 && data.correct == 1 )
                    {
                        $('#result').append(' <span style="color:red; clear: both;">You\'re the first to get this right! Congrats!</span>');
                    }
                    else if ( distance == 0 && data.correct < 11 )
                    {
                        $('#result').append(' <span style="color:red; clear: both;">You\'re the ' + utils.to_ordinal(data.correct) + ' to get this right! Right on!</span>');
                    }
                }
                })
                .fail(function() {
                    $('#result').append(' Sorry, we could not reach the upstream servers.');
                })
                .always(function() {
                });

            // If this map is part of a group game, communicate the distance to the parent frame.
            // Group games, as of now, will be a bunch of iframes.
            window.parent.postMessage({distance: distance}, '*');
        }
    },
    great_circle: function(lat1, lon1, lat2, lon2)
    {
        // Calculate the distance between two sets of lat/longs.
        // Cribbed from http://stackoverflow.com/questions/5260423/torad-javascript-function-throwing-error/7179026#7179026
        var R = 3958.7558657440545; // Radius of earth in Miles
        var dLat = Math.radians(lat2-lat1);
        var dLon = Math.radians(lon2-lon1);
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(Math.radians(lat1)) * Math.cos(Math.radians(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d;
    },
    guess: {},
    show_answer: function(distance)
    {
        // Given an integer of how many miles / km the guess was from the target,
		// show the result and then log the answer.
		var r = document.getElementById('result');
        if ( distance == 0 || +distance < this.config.answer_fuzz )
        {
            r.textContent = 'You got it right! Congratulations!';
        }
        else
        {
            var unit = this.config.unit;
            var s = 's';
            if ( distance === 1 || this.config.unit === 'km' ) s = '';
            if ( this.config.unit == 'miles' && s == '' ) unit = 'mile';
            r.textContent = 'Your guess landed ' + distance + ' ' + unit + ' from the target.';
        }
        this.log_answer(distance, this.guess.lat(), this.guess.lng());
    },
    make_guess_handheld: function()
    {
        // The onClick function when the handheld button is pressed.
        var center = mapg.map.getCenter();
        var lat = center.lat(), lon = center.lng();

        // If the marker hasn't been moved we don't want to do anything:
        if ( this.config.markerlatlng.lat() == lat && this.config.markerlatlng.lng() == lon ) return false;

        // We need a LatLng object later on.
        mapg.guess = new google.maps.LatLng(lat, lon);
        
        // Replace the crosshairs with a marker pin
        var el = document.getElementById('crosshairs');
        el.parentNode.removeChild(el);
        
        // Remove the submit buttons
        var el = document.getElementById('submit-button');
        el.parentNode.removeChild(el);
        var el = document.getElementById('bottom-submit');
        el.parentNode.removeChild(el);
        
        // One more style clean-up
        var el = document.getElementById('interface');
        el.setAttribute('class', 'after-guess');

        var answer_marker = new google.maps.Marker(
        {
            position: mapg.guess,
            map: mapg.map,
            title: 'Your Guess'
        });
        mapg.make_guess(lat, lon);
    },
    make_guess_desktop: function(guess)
    {
        var lat = guess.latLng.lat(), lon = guess.latLng.lng();
        // If the marker hasn't been moved we don't want to do anything:
        if ( this.config.markerlatlng.lat() == lat && this.config.markerlatlng.lng() == lon ) return false;
        //console.log(this.config, guess, this.config.markerlatlng.lat(), lat);
        
        // Keep people from guessing again.
        this.guess = guess.latLng;
        window.answer_marker.draggable = false;
        google.maps.event.clearListeners(window.answer_marker, 'mouseup');

        this.make_guess(lat, lon);
    },
    make_guess: function(lat, lon)
    {
        // Check how far the click was from the target.
        // There are two types of target checks: Lat-Long, used for small cities or foreign cities
        // (cities smaller than five miles wide, or cities we don't have boundary data for), and
        // boundary target checks. For boundary checks we need the KML string for the boundary.
        if ( this.config.target_type == 'latlng' )
        {
            var distance = this.great_circle(this.config.target.lat(), this.config.target.lng(), lat, lon)
            var distance_rounded = Math.round(distance);

            // If we have a value for mapg.config.radius, we subtract that from the distance.
            if ( this.radius > 0 )
            {
                distance_rounded = distance_rounded - this.radius;
                if ( distance_rounded < 0 ) distance_rounded = 0;
            }

            // Show where the target was.
            var target_marker = new google.maps.Marker(
            {
                icon: '//maps.google.com/mapfiles/ms/icons/green-dot.png',
                position: this.config.target,
                map: this.map,
                draggable: false,
                title: this.config.target_name
            });

            this.show_answer(distance_rounded);
        }
        else if ( this.config.target_type == 'boundary' )
        {
            // Start on the boundary work.
            // this.find_distance handles the guess calculations.
            //var guess = { lat: lat, lon: lon }
            var geoxml_config = {
                map: this.map,
                processStyles: true,
                zoom: false,
                afterParse: this.find_distance,
                failedParse: this.failed_parse,
                createOverlay: this.create_overlay,
                createMarker: this.create_marker
            };
            var kml_parser = new geoXML3.parser(geoxml_config);
            kml_parser.parse(this.config.boundary_file);
        }
    },
    find_distance: function find_distance(obj)
    {
        // See how close the guess was to the nearest point,
        // in case the guess was outside the boundary.
        shapes = obj[0].placemarks[0].Polygon;
        //console.log(obj, shapes);
        var shapes_len = shapes.length;
        var best_guess = 0.0;
        var in_bounds = google.maps.geometry.poly.containsLocation(mapg.guess, obj[0].gpolygons[0]);
        var guess_rounded = 0;
        if ( in_bounds === false )
        {
            for ( var j = 0; j < shapes_len; j++ )
            {
                coords = shapes[j].outerBoundaryIs[0].coordinates;
                var len = coords.length;
                for ( var i = 0; i < len; i++ )
                {
                    var distance = mapg.great_circle(coords[i].lat, coords[i].lng, mapg.guess.lat(), mapg.guess.lng());
                    if ( best_guess === 0.0 ) best_guess = distance;
                    else if ( distance < best_guess ) best_guess = distance;
                }
            }

            guess_rounded = Math.round(best_guess);
        }
        else
        {
            // woohoo a correct answer
            //obj[0].styles.inline['color'] = '00ff00ff';
            //obj[0].placemarks[0].style.color = '00ff00ff';
        }
        window.mapg.show_answer(guess_rounded);
    },
    failed_parse: function failed_parse(obj)
    {
        //console.log('Fail: ', obj);
    },
    create_overlay: function create_overlay(obj) { kml_parser.createOverlay(obj); },
    create_marker: function create_marker(obj) { kml_parser.createMarker(obj); }
};

Math.radians = function(degrees)
{
    return degrees * (Math.PI / 180);
}


$(document).ready( function() { mapg.init(); });

var utils = {
    ap_numerals: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
    months: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    ap_months: ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'],
    ap_date: function(date) {
        // Given a date such as "2018-02-03" return an AP style date.
        var this_year = new Date().getFullYear();
        var parts = date.split('-')
        var day = +parts[2];
        var month = this.ap_months[+parts[1] - 1];
        if ( this_year == +parts[0] ) return month + ' ' + day;
        return month + ' ' + day + ', ' + parts[0];
    },
	to_ordinal: function(n) {
		// From https://gist.github.com/jlbruno/1535691
	   var s=["th","st","nd","rd"],
		   v=n%100;
	   return n+(s[(v-20)%10]||s[v]||s[0]);
	},
    rando: function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for ( var i=0; i < 8; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    },
    rando_by_day: function(max) {
        // Generate a semi-random integer from zero to the max argument,
        // based on what the date is.
        var d = new Date().getDate();
        return d % +max;
    },
    get_rando_by_day: function(arr) {
        // Given an array, return a random item from it based on today's date.
        var l = arr.length;
        var index = this.rando_by_day(l);
        return arr[index];
    },
    add_zero: function(i) {
        // For values less than 10, return a zero-prefixed version of that value.
        if ( +i < 10 ) return "0" + i;
        return i;
    },
    add_zeros: function(i, digits) {
        // Fill decimals with zeros to the number of digits. Returns a string.
        var str = '' + +i;
        var len = str.length - 2;   // The "2" is the "0." in the string.

        while ( len <= digits ) {
            str = str + '0';
            len = str.length - 2;
        }
        // Axe the leading zero, if there is one
        str = str.replace('0.', '.');
        return str;
    },
    parse_date_str: function(date) {
        // date is a datetime-looking string such as "2017-07-25"
        // Returns a date object.
        if ( typeof date !== 'string' ) return Date.now();

        var date_bits = date.split(' ')[0].split('-');

        // We do that "+date_bits[1] - 1" because months are zero-indexed.
        var d = new Date(date_bits[0], +date_bits[1] - 1, date_bits[2], 0, 0, 0);
        return d;
    },
    parse_date: function(date) {
        // date is a datetime-looking string such as "2017-07-25"
        // Returns a unixtime integer.
        var d = this.parse_date_str(date);
        return d.getTime();
    },
    days_between: function(from, to) {
        // Get the number of days between two dates. Returns an integer. If to is left blank, defaults to today.
        // Both from and to should be strings 'YYYY-MM-DD'.
        // Cribbed from https://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-javascript
        if ( to == null ) to = new Date();
        else to = this.parse_date_str(to);
        from = this.parse_date_str(from);
        var days_diff = Math.floor((from-to)/(1000*60*60*24));
        return days_diff;
    },
    get_json: function(path, obj, callback) {
        // Downloads local json and returns it.
        // Cribbed from http://youmightnotneedjquery.com/
        var request = new XMLHttpRequest();
        request.open('GET', path, true);

        request.onload = function() {
            if ( request.status >= 200 && request.status < 400 ) {
                obj.data = JSON.parse(request.responseText);
                callback();
            }
            else {
                console.error('DID NOT LOAD ' + path + request);
                return false;
            }
        };
        request.onerror = function() {};
        request.send();
    },
    add_class: function(el, class_name) {
        // From http://youmightnotneedjquery.com/#add_class
        if ( el.classlist ) el.classList.add(class_name);
        else el.className += ' ' + class_name;
        return el;
    },
    add_js: function(src, callback) {
        var s = document.createElement('script');
        if ( typeof callback === 'function' ) s.onload = function() { callback(); }
        //else console.log("Callback function", callback, " is not a function");
        s.setAttribute('src', src);
        document.getElementsByTagName('head')[0].appendChild(s);
    },
}
