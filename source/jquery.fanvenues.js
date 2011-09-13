/**********************************************************************************************************
 Fanvenues 3D Interactive Seating Maps <http://www.fanvenues.com>
 Copyright (c) 2010 Peekspy Pte Ltd <http://www.peekspy.com>
 Author: Oliver Oxenham
 Date created: 2010-08-02
 Date updated: 2011-09-13
 Latest version: 2.2.4
 2.2.4 : resolved logical bug in price filtering within sections.
 		 prevent filtered out sections from being selected.
 2.2.3 : resolved price filtering bug where sections filtered became unfiltered after a mouseout event.
 		 changed use of 'for..in' to standard for-loop to loop through arrays.
 2.2.2 : resolved bug in IE9 ajax requests preventing calls to fanvenues server because of missing 'onprogress' function.
 2.2.1 : added bind event 'fvmapReady' - triggered when the map is loaded and ready to use.
 		 updated online documentation api.
 2.2.0 : worked out some browser compatibilities issues. now opens fine in Firefox 3.5 and above.
 2.1.9 : solved bug in IE9 ajax requests that is not consistent with XMLHttpRequest
 2.1.8 : change jsonp requests to post requests for quicker data transfer especially with extremely large ticket lists.
 2.1.7 : clear all previous event bindings before attaching new ones.
 2.1.6 : changed spic and lpic to pic. Original image size is 1400x752. To get a resized image, append argument 'size=<width>x<height>'.
	 added new option to customize thumbnail image size (ssize) and enlarged image size (lsize).
 2.1.5 : improved 3D views (better quality) for Fanvenues v2.1.5 and above.
 2.1.4 : fanvenues now using new tile server fanvenues3.
 2.1.3 : removed the 'arrow button' which appeared when action buttons (fullscreen, reset and print) are enabled.
 2.1.2 : added 'scrollWheelZoom' to options. Default set to 'false' to avoid zooming in and out with mouse scrollwheel.
		 added public methods 'getLargeImage', 'getSmallImage' and 'getAllSections'.
		 disabled right-clicking on the ticket row.
		 removed bind event 'fvmapSectionClick'.
		 added bind event 'fvmapSectionDeselect' (triggered when a section is deselected) and 'fvmapSectionSelect' (triggered when a section is selected).
		
 2.1.1 : changed 'rowsSelector' to 'rowSelector'.
         changed id 'priceSliderAmount' to class.
		 added private method for loading priceFilter.
		 changed priceFilterContainer from ul to div.
		
 2.1.0 : Added jQuery section and row selectors as options (removed the old way of interacting with ticket list).
		 Added public method wrappers for focusSection, blurSection, clickSection.
		 Changed all event names to camel-case: fvmapSectionBlur, fvmapSectionSelect, fvmapSectionDeselect, 
		 										fvmapSectionFocus, fvmapNotAvailable
		 Added <ul> elements as parents of <li> elements.
		 Removed 'fvmsg' div.
		 Changed price slider id to class.
		 Standardized class names for price slider.
		 Now passing current version to Fanvenues server for appropriate response.
		
 2.0.5 : added new bind event: 'fvmap-section-blur' for when mouse moves out of a section
 2.0.4 : convert ticket price to string
 2.0.3 : set streetViewControl to false
 2.0.2 : added new bind events: 'fvmap-section-selected', 'fvmap-section-deselect', 'fvmap-section-hover'
 2.0.1 : changed bind event from 'enlarge-image' to 'fvmap-enlarge-image'.
 2.0.0 : Fanvenues released.
 *********************************************************************************************************/

/* 
 Dependencies:
	- jQuery v1.4.2
	- jQuery UI v1.8.4
	- Google Maps API v3	
*/


(function($) {
	//
	// Fanvenues plugin extens the jQuery framework to provide ticket brokers sites with interactive seating maps.
	//

	$.fn.fanvenues = function(options) {
		// build main options before element iteration
		opts = $.extend({}, $.fn.fanvenues.defaults, options);

		// iterate and reformat each matched element
		return this.each(function() {
			var $this = $(this);

			// force cross-site scripting (as of jQuery 1.5)
			jQuery.support.cors = true;  

			// clear all previous bindings before attaching new ones
			$this.unbind();


			// set height and width of $this
			if ($this.css('width') != '0px') {
				var w = $this.css('width');
				$($this).width(w);
				opts.width = w;
			}
			else {
				$($this).width(opts.width);
			}

		    if ($this.css('height') != '0px') {
				var h = $this.css('height')
				$($this).height(h);
				opts.height = h;
			}
			else {
				$($this).height(opts.height);
			}

			// Bind callbacks to $this
			$this.bind('onReceiveVenueData', opts.onReceiveVenueData);
			$this.bind('onReceiveSectionData', opts.onReceiveSectionData);

			// send request to server for mapSet and mapId
			// $.getJSON(fvBaseUrl+'/getdata-2?p=' + opts.mapSet + '&l=' + opts.mapId + '&el=' + $this.attr('id') + '&c=' + opts.custom3d + '&v=' + opts.version + '&format=json&jsoncallback=?', function() {});
			var params = {
				p : opts.mapSet,
				l : opts.mapId,
				el: $this.attr('id'),
				c : opts.custom3d,
				v : opts.version
			}

			if ($.browser.msie && window.XDomainRequest) {
            	// Use Microsoft XDR
            	var xdr = new XDomainRequest();
            	xdr.open("post", fvBaseUrl+'/getdata-2');
            	xdr.onprogress = function() { var p = 0; };
            	xdr.onload = function() {
					var data = eval(xdr.responseText);
					if (data.length > 1)
						$this.trigger("onReceiveVenueData", [data[0], data[1], data[2]]);

					if ((data.length == 1) && (data[0] == 'fvmapNotAvailable'))
						$this.trigger("fvmapNotAvailable");
            	};
            	var xdrStr = "p="+params.p+"&l="+params.l+"&el="+params.el+"&c="+params.c+"&v="+params.v;
            	xdr.send(xdrStr);
			} 
        	else {
				// your ajax request here
	            $.ajax({
					url: fvBaseUrl+'/getdata-2',
					data: params,
					type: 'POST',
					success: function(params) {
						var data = eval(params);
						if (data.length > 1)
							$this.trigger("onReceiveVenueData", [data[0], data[1], data[2]]);

						if ((data.length == 1) && (data[0] == 'fvmapNotAvailable'))
							$this.trigger("fvmapNotAvailable");
					},
					error: function(jqXHR, textStatus, errorThrown) {
					}
				});
			}

		});
	};
	
	//
	// private functions & variables
	//
	var fvBaseUrl = "http://fanvenues2.appspot.com";
	var minZoom = 2;
	var maxZoom = 4;
	var zIndex = 100;
	var layout_id;
	var mapTilesUrl;
	var opts;
	var priceFilterLoaded = false;
	var minP = 0;
	var maxP = 999999;
	var ticketRows;		// stores all rows in ticket list if interactivity is ON
	var tixListClick = false;	// only filter ticket list if click was NOT triggered from ticket list
	var fvCallbacks= [];	// temporary variable for callback strings
	var fvTicketList = {};	// fv section list for current venue in JSON format (also contains coordinates info for sections)
	var sectionTranslator = {};	// translated ticket list (from broker section namings to fv namings)
	var sectionManager = {};	// manages the polygons on the map
	var sectionSelected = []; // manages selected sections
	var rowsToHideOnFilter;		// rows to hide/show upon filtering ticket list
	var FVMap;				// main variable controlling the google custom map

	// fullscreen options
	var beforeFullscreen = {};

	// Section styling on ticket availability
	var polyStrokeColor = '#000000';
	var polyStrokeOpacity = 0;
	var polyStrokeWeight = 0;
	var polyFillColor = '#000000';
	var polyFillOpacity = 0;
	var polyTixFillColor = '#000000';
	var polyTixFillOpacity = 0;
	var polyHoverFillColor = '#000000';
	var polyHoverFillOpacity = 0.5;
	var polyTixSelectedFillColor = '#000000';
	var polyTixSelectedFillOpacity = 0;

	var sliderValues = [];		// used to resolve bug in jQuery ui slider where values change when map is moved

	var sanitizeSectionName = function (str) {
		return str.replace("'","").replace("*","").replace("`","").replace('"','');
	};
	
	var urlencode = function (str) {
		str = escape(str);
		return str.replace(/[*+\/@]|%20/g, function (s) {
			   switch (s) {
				   case "*": s = "%2A"; break;
				   case "+": s = "%2B"; break;
				   case "/": s = "%2F"; break;
				   case "@": s = "%40"; break;
				   case "%20": s = "+"; break;
			   }
			   return s;
	   });
	}; 

	var urldecode = function (str) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < str.length ) {

			c = str.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = str.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = str.charCodeAt(i+1);
				c3 = str.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	};
	
	var hidePolygon = function (p) {
		hideOptions = {
		    strokeColor: polyStrokeColor,
		    strokeOpacity: polyStrokeOpacity,
		    strokeWeight: polyStrokeWeight,
		    fillColor: polyFillColor,
		    fillOpacity: polyFillOpacity
		}
		p.setOptions(hideOptions);	
	};
	
	var showPolygon = function (p) {
		showOptions = {
		    strokeColor: polyStrokeColor,
		    strokeOpacity: polyStrokeOpacity,
		    strokeWeight: polyStrokeWeight,
		    fillColor: polyTixFillColor,
		    fillOpacity: polyTixFillOpacity
		}
		p.setOptions(showOptions);	
	};
	
    var loadFVMap = function (el) {
        var mapOptions = {
			disableDoubleClickZoom: true,
			scrollwheel: opts.scrollWheelZoom,
            scaleControl: false,
			disableDefaultUI: true,
			streetViewControl: false,
            mapTypeControl: false
        };

		FVMap = new google.maps.Map(el, mapOptions);
		FVMap.setCenter(new google.maps.LatLng(0, 0, true));
		FVMap.setZoom(opts.defaultZoom);
		
        var fvMapType = new google.maps.ImageMapType({
            getTileUrl: function(a, b) {
                var c = Math.pow(2, b);
                var d = a.x;
                var e = a.y;
                var f = "t";
                for (var g = 0; g < b; g++) {
                    c = c / 2;
                    if (e < c) {
                        if (d < c) {
                            f += "q";
                        }
                        else {
                            f += "r";
                            d -= c;
                        }
                    }
                    else {
                        if (d < c) {
                            f += "t";
                            e -= c;
                        }
                        else {
                            f += "s";
                            d -= c;
                            e -= c;
                        }
                    }
                }
                tile = mapTilesUrl + f + ".jpg";
                return tile;
            },
            tileSize: new google.maps.Size(256, 256),
            isPng: false,
            maxZoom: maxZoom,
            minZoom: minZoom,
            name: "Fanvenues 3D Interactive Seating Maps"
        });

        FVMap.mapTypes.set('fanvenues', fvMapType);
		FVMap.setMapTypeId('fanvenues');

		google.maps.event.addListener(FVMap, "tilesloaded", function() {  
			// Initialize slider here too as Firefox doesn't init it until all Tiles are loaded
			if (opts.priceFilter && !priceFilterLoaded) {
				var $this = $(FVMap.getDiv());
				loadPriceFilter($this);
			}
			priceFilterloaded = true;
		});
		
		// lock map so it doesn't move too far from center
		google.maps.event.addListener(FVMap, "center_changed", function() {
			var thisLng = this.getCenter().lng();
			var thisLat = this.getCenter().lat();
			if (thisLng < -60) {
				FVMap.setCenter(new google.maps.LatLng(parseFloat(thisLat), -60));
			}
			if (thisLng > 60) {
				FVMap.setCenter(new google.maps.LatLng(parseFloat(thisLat), 60));
			}
			if (thisLat < -90) {
				FVMap.setCenter(new google.maps.LatLng(-90, parseFloat(thisLng)));
			}
			if (thisLat > 90) {
				FVMap.setCenter(new google.maps.LatLng(90, parseFloat(thisLng)));
			}
		});
		// append hidden divs to control map styling
		$(el)	.append($('<div class="section focus"></div>'))
				.append($('<div class="section available"></div>'))
				.append($('<div class="section selected"></div>'));
    };

	var mapTicketList = function(el) {
		var sectionStr = '';
		var itemsCount = opts.ticketList.items.length;

		for (var i = 0; i < itemsCount; i++) {
            if (i == itemsCount - 1)
            	sectionStr = sectionStr + sanitizeSectionName(opts.ticketList.items[i].section) + "**" + opts.ticketList.items[i].price.toString();
            else
            	sectionStr = sectionStr + sanitizeSectionName(opts.ticketList.items[i].section) + "**" + opts.ticketList.items[i].price.toString() + ",";
		}

        var params = {
        	l  : layout_id,
        	s  : sectionStr
        }

		var $this = $(el);

		if ($.browser.msie && window.XDomainRequest) {
	    	// Use Microsoft XDR
	    	var xdr = new XDomainRequest();
	    	xdr.open("post", fvBaseUrl+'/getsectionlist-2');
			xdr.onprogress = function() {};		// this is required for subsequent XDomainRequest
	    	xdr.onload = function() {
				var params = xdr.responseText;
				var data = eval('['+params+']');
				$this.trigger("onReceiveSectionData", data);
	    	};
	    	var xdrStr = "l="+params.l+"&s="+params.s;
	    	xdr.send(xdrStr);
		} 
		else {
			$.post(fvBaseUrl+'/getsectionlist-2', params, function(params) {
				var data = eval('['+params+']');
				$this.trigger("onReceiveSectionData", data);
			});
		}
	};
	
	var createInteractionWithTicketList = function (el) {
		// DONT FORGET TO SANITIZE SECTION NAME
		// add mouse events to ticket listing rows
		ticketRows = $(opts.rowSelector);
		ticketRows.hover(
			function(e){
				var thisRow = $(this);
				thisRow[0].oncontextmenu = function() {
					e.stopPropagation();
		            		return false;
		        	}
				thisRow.addClass('active');
				thisRow.children().addClass('active');
				var sectionName = sanitizeSectionName(thisRow.find(opts.sectionSelector).text());
				google.maps.event.trigger(sectionManager[sectionTranslator[sectionName]][0], "mousemove");
			},
			function(e){
				var thisRow = $(this);
				thisRow.removeClass('active');
				thisRow.children().removeClass('active');
				var sectionName = sanitizeSectionName(thisRow.find(opts.sectionSelector).text());
				google.maps.event.trigger(sectionManager[sectionTranslator[sectionName]][0], "mouseout");				
			}
		);

        ticketRows.mousedown( 
			function(e) {
				var evt = e;
				$(this).mouseup( function() {
				    $(this).unbind('mouseup');
				    if( evt.button == 2 ) {
						/* DISABLE RIGHT-CLICKING 
						tixListClick = true;
						var sectionName = sanitizeSectionName($(this).find(opts.sectionSelector).text());
						google.maps.event.trigger(sectionManager[sectionTranslator[sectionName]][0], "rightclick");
						*/
				        return true;
				    } else {
						var sectionName = sanitizeSectionName($(this).find(opts.sectionSelector).text());
						var polygon = sectionManager[sectionTranslator[sectionName]][0];
			            var bounds = new google.maps.LatLngBounds();
			            polygon.getPath().forEach(function(p, n) {
			                bounds.extend(p);
			            });
						FVMap.setZoom(3);
						FVMap.panTo(bounds.getCenter());
				        return true;
				    }
				});
	         }
		);
		// cache all rows to hide/show on ticket list filter
		if (opts.rowsToHideOnFilterSelector != '') {
			rowsToHideOnFilter = $(opts.rowsToHideOnFilterSelector);
		}		
	};
	
	var filterTicketList = function () {
		// filters the ticket list based on selected sections on the map
		if (sectionSelected.length == 0) {
			if (opts.rowsToHideOnFilterSelector != '') {
				rowsToHideOnFilter.show();
			}
			ticketRows.show();
		}
		else {
			if (opts.rowsToHideOnFilterSelector != '') {
				rowsToHideOnFilter.hide();
			}
			ticketRows.each(function() {
				var sectionName = sanitizeSectionName($(this).find(opts.sectionSelector).text());
				if ($.inArray(sectionTranslator[sectionName],sectionSelected) < 0) {	// if section was not selected
					$(this).hide();
				}
				else {
					$(this).show();
				}
			});
		}
	};
	
	var convertRGBToHex = function (s) {
		if ('rgb'.indexOf(s) === 0) {
			var rgbString = s; 
			var parts = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			delete (parts[0]);
			for (var i = 1; i <= 3; ++i) {
			    parts[i] = parseInt(parts[i]).toString(16);
			    if (parts[i].length == 1) parts[i] = '0' + parts[i];
			}
			return('#'+parts.join(''));
		}
		else {
			return s;
		}
	};
	
	var initSection = function(id, el) {
	    var s = fvTicketList[id];
	    var el = $(el);
	    if (s.coords != "") {
	        var coords = s.coords.split('*');
	        var gmarkers = [];
	        for (x = 0; x < coords.length; x++) {
	            var coord = coords[x].split(',');
	            var m = new google.maps.LatLng(parseFloat(coord[0]), parseFloat(coord[1]));
	            gmarkers.push(m);
	        }
	        s.markers = gmarkers;

	        if (s.markers.length > 0) {
				// create new polygon for this section
				var tmpFillColor = polyFillColor;
				var tmpFillOpacity = polyFillOpacity;
				
                var polygon = new google.maps.Polygon({
                    paths: s.markers,
                    strokeColor: polyStrokeColor,
                    strokeOpacity: polyStrokeOpacity,
                    strokeWeight: polyStrokeWeight,
                    fillColor: polyFillColor,
                    fillOpacity: polyFillOpacity
                });

	            if (s.section != undefined) {	// if tickets are available within this section
					tmpFillColor = polyTixFillColor;
					tmpFillOpacity = polyTixFillOpacity;
					polygon.setOptions({
						fillColor: polyTixFillColor,
						fillOpacity: polyTixFillOpacity
					});
	            }
				
	            // Add events to the new polygon (section)
	            google.maps.event.addListener(polygon, "mouseout",
	            function() {	    
					if ($.inArray(id, sectionSelected) > -1) {
		                thisOptions = {
		                    strokeColor: polyStrokeColor,
		                    strokeOpacity: polyStrokeOpacity,
		                    strokeWeight: polyStrokeWeight,
		                    fillColor: polyTixSelectedFillColor,
		                    fillOpacity: polyTixSelectedFillOpacity
		                };
		                this.setOptions(thisOptions);					
					}
					else {
						var min = minP;
						var max = maxP;
						if (max == 405)
							max = 99999;
						if ((fvTicketList[id].minPrice >= min) && (fvTicketList[id].maxPrice <= max)) {
							thisOptions = {
			                    strokeColor: polyStrokeColor,
			                    strokeOpacity: polyStrokeOpacity,
			                    strokeWeight: polyStrokeWeight,
			                    fillColor: polyTixFillColor,
			                    fillOpacity: polyTixFillOpacity
			                }
			                this.setOptions(thisOptions);
						}
						else {
			                thisOptions = {
			                    strokeColor: polyStrokeColor,
			                    strokeOpacity: polyStrokeOpacity,
			                    strokeWeight: polyStrokeWeight,
			                    fillColor: polyFillColor,
			                    fillOpacity: polyFillOpacity
			                }
			                this.setOptions(thisOptions);
						}
					}
					$("#"+el.attr('id')).trigger("fvmapSectionBlur", [fvTicketList[id].pic + "?size=" + opts.ssize, fvTicketList[id].name]);
	            });

	            google.maps.event.addListener(polygon, "mousemove",
	            function(e) {		
				if ($.inArray(id, sectionSelected) > -1) {
		                	thisOptions = {
		                    		strokeColor: polyStrokeColor,
		                    		strokeOpacity: polyStrokeOpacity,
		                    		strokeWeight: polyStrokeWeight,
		                    		fillColor: polyTixSelectedFillColor,
		                    		fillOpacity: polyTixSelectedFillOpacity
		                	};
		                	this.setOptions(thisOptions);					
				}				
				else {
		                	thisOptions = {
		                    		strokeWeight: polyStrokeWeight,
		                    		strokeOpacity: polyStrokeOpacity,
		                    		strokeColor: polyStrokeColor,
		                    		fillColor: polyHoverFillColor,
		                    		fillOpacity: polyHoverFillOpacity
		                	};
		                	this.setOptions(thisOptions);
				}
				$("#"+el.attr('id')).trigger("fvmapSectionFocus", [fvTicketList[id].pic+"?size=" + opts.ssize, fvTicketList[id].name]);
	            });
				
				// polygon right-click
				google.maps.event.addListener(polygon, "rightclick",
				function() {
					$("#"+el.attr('id')).trigger("fvmapEnlargeImage", [fvTicketList[id].pic+"?size=" + opts.lsize, fvTicketList[id].name]);
				});
				
				// polygon left-click
	            google.maps.event.addListener(polygon, "click",
	            function() {
					if (fvTicketList[id].section != undefined) {		// do not select sections that do not have tickets
						if ($.inArray(id, sectionSelected) > -1) {		// section is selected. remove from array.
							sectionSelected = $.grep(sectionSelected, function(i) { return i != id; });	// removing section from array
							$("#"+el.attr('id')).trigger("fvmapSectionDeselect", [fvTicketList[id].pic+"?size="+opts.ssize, fvTicketList[id].name]);
						}
						else {
							if ((parseFloat(fvTicketList[id].minPrice) > parseFloat(maxP)) || (parseFloat(fvTicketList[id].maxPrice) < parseFloat(minP))) {
								// this section is currently filtered out so user can't select it
							}
							else {
								sectionSelected = [id].concat(sectionSelected);			// section is not selected. adding section to array.
								if (opts.interactWithTicketList) {
									var ticketsInSection = fvTicketList[id].sections;
									$("#"+el.attr('id')).trigger("fvmapSectionSelect", [fvTicketList[id].pic+"?size="+opts.ssize, fvTicketList[id].name, ticketsInSection]);
								}
								else {
									$("#"+el.attr('id')).trigger("fvmapSectionSelect", [fvTicketList[id].pic+"?size="+opts.ssize, fvTicketList[id].name]);
								}
							}
						}
						if (opts.interactWithTicketList)
							filterTicketList();
					}
					google.maps.event.trigger(polygon, "mousemove");		// trigger mousemove to update section color
	            });
	
				// Add polygon to Section Manager
	            sectionManager[id] = [polygon, 0, 0];
	
	        }
			sectionManager[id][0].setMap(FVMap);
	    }
	    else {
	        s.markers = [];
	    }
	};
	
	var CopyrightInfo = function (controlDiv) {
		$(controlDiv)	.css('padding-bottom','2px')
						.css('padding-right','5px');
		// Set CSS for the control interior
		var controlText = $('<div></div>');
		$(controlText)
			.css('cursor','pointer')
			.css('text-align','center')
			.attr('title','Visit Fanvenues.com')
			.css('font-family','Arial,sans-serif')
			.css('font-size','10px')
			.append('3D Interactive Seating Maps &copy 2010, <a href="http://www.fanvenues.com">Fanvenues.com</a>');
		$(controlDiv).append($(controlText));
	};


	var PriceFilter = function (controlDiv) {
		// Set CSS for the control border
		$(controlDiv).attr('class','priceFilter')
					.css('height','35px')
					.append($('<p><label>Price range:<input type="text" class="priceSliderAmount" readonly="readonly" /></label></p><div class="priceSlider"></div>'));
	};
	
	var ZoomList = function (controlDiv) {
		$(controlDiv).attr('class','zoomList');
		$("<li />")	
			.addClass('ui-state-default ui-corner-all')
			.attr('title','Zoom in')
			.append($("<span class='ui-icon ui-icon-circle-plus'></span>"))
			.click(function() {
				if ((FVMap.getZoom() + 1) <= maxZoom) 
					FVMap.setZoom(FVMap.getZoom() + 1);				
			})
			.appendTo($(controlDiv));
			
		$("<li />")	
			.addClass('ui-state-default ui-corner-all')
			.attr('title','Zoom out')
			.append($("<span class='ui-icon ui-icon-circle-minus'></span>"))
			.click(function() {
				if ((FVMap.getZoom() - 1) >= minZoom) 
					FVMap.setZoom(FVMap.getZoom() - 1);			
			})
			.appendTo($(controlDiv));
	};
	
	var toggleMapFullscreen = function(el) {
		if (!$(el).hasClass('fullscreen')) { // Going fullscreen: Save current values.
			$this = $(this);
			beforeFullscreen = {
				parentElement: $(el).parent(),
				index: $(el).parent().children().index($(el)),
				x: $(window).scrollLeft(), y: $(window).scrollTop()
			};
			// Set values needed to go fullscreen.
			$('body').append($(el)).css('overflow', 'hidden');
			$(el).addClass('fullscreen');
			$(el).css('position','absolute');
			$(el).width($(window).width());
			$(el).height($(window).height());
			google.maps.event.trigger(FVMap, 'resize');
			FVMap.setZoom(3);
			FVMap.setCenter(new google.maps.LatLng(0, 0, true));
			window.scroll(0,0);
			$(window).keyup(function(e) {
				if (e.keyCode == '27') {
					e.preventDefault();
					if ($(el).hasClass('fullscreen'))
						$this.trigger('click');
				}
			});					
		}
		else { // Going back to normal:
			// Restore saved values.
			$(el).removeClass('fullscreen');
			$(el).css('position','relative');
			$(el).width(opts.width);
			$(el).height(opts.height);

			google.maps.event.trigger(FVMap, 'resize');
			FVMap.setZoom(1);
			FVMap.setCenter(new google.maps.LatLng(0, 0, true));
			if (beforeFullscreen.index >= beforeFullscreen.parentElement.children().length) {
				beforeFullscreen.parentElement.append($(el));
			} 
			else {
				$(el).insertBefore(beforeFullscreen.parentElement.children().get(beforeFullscreen.index));
			}
			$('body').css('overflow', 'auto');
			window.scroll(beforeFullscreen.x, beforeFullscreen.y);
		}
	};
	
	var ActionList = function (controlDiv, el) {
		$(controlDiv).attr('class','actionList');
		/*
		if (opts.fullscreenMapButton || opts.resetMapButton || opts.printMapButton) {
			$("<li />")	
				.addClass('ui-state-default ui-corner-all')
				.attr('title','Show / Hide Actions')
				.append($("<span class='ui-icon ui-icon-triangle-1-s'></span>"))
				.click(function(){
					$(this).siblings().slideToggle();
				})
				.appendTo($(controlDiv));
		}
		*/
		if (opts.fullscreenMapButton) {
			$("<li />")	
				.addClass('ui-state-default ui-corner-all')
				.attr('title','Fullscreen / Restore')
				.append($("<span class='ui-icon ui-icon-arrowthick-2-ne-sw'></span>"))
				.click(function(){
					toggleMapFullscreen(el);
				})
				.appendTo($(controlDiv));
		}

		if (opts.resetMapButton) {
			$("<li />")	
				.addClass('ui-state-default ui-corner-all')
				.attr('id','resetMapButton')
				.attr('title','Reset map')
				.append($("<span class='ui-icon ui-icon-refresh'></span>"))
				.click(function(){
					var l = sectionSelected.length;
					for (var i=0; i < l; i++) {
						var s = sectionManager[sectionSelected[0]];		// always select the first element from sectionSelected
						google.maps.event.trigger(s[0], "click");
					}
					
					sectionSelected = [];

					for (var i in sectionManager) {
						sectionManager[i][2] = 0;
						google.maps.event.trigger(sectionManager[i][0], "mouseout");
					}
					if (opts.interactWithTicketList)
						filterTicketList();
					FVMap.setCenter(new google.maps.LatLng(0, 0, true));
					FVMap.setZoom(opts.defaultZoom);
				})
				.appendTo($(controlDiv));
		}
		
		if (opts.printMapButton) {
			$("<li />")	
				.addClass('ui-state-default ui-corner-all')
				.attr('title','Print map')
				.append($("<span class='ui-icon ui-icon-print'></span>"))
				.click(function(){
					if (!$(el).hasClass('fullscreen')) { // Going fullscreen:
						toggleMapFullscreen(el);
					}
					FVMap.setZoom(2);
					setTimeout('window.print(); alert("Done printing. Click Fullscreen button to go back to listing.");', 2000);
				})
				.appendTo($(controlDiv));
		}
		
		$(controlDiv).children().hover(function() { 
			$(this).addClass('ui-state-hover'); 
		}, function() { 
			$(this).removeClass('ui-state-hover'); 
		});		
	}
	
	var loadPriceFilter = function ($this) {
		$this.find('.priceSlider').slider({
			range: true,
			min: 0,
			max: 405,
			step: 5,
			values: [0, 405],
			slide: function(event, ui) {
				if (ui.values[1] == 405) {
					$this.find('.priceSliderAmount').val('$' + ui.values[0] + ' - $Max');
					$.fn.fanvenues.filter(ui.values[0], 999999);
					minP = ui.values[0];
					maxP = 999999;
				}
				else {
					$this.find('.priceSliderAmount').val('$' + ui.values[0] + ' - $' + ui.values[1]);
					$.fn.fanvenues.filter(ui.values[0],ui.values[1]);
					minP = ui.values[0];
					maxP = ui.values[1];
				}
			}
		});
		$this.find('.priceSliderAmount').val('$' + $this.find('.priceSlider').slider("values", 0) + ' - $Max');
	}


	//
	// public functions
	//
	
	$.fn.fanvenues.setZoom = function (zoomLevel) {
		// sets change the map zoom level to zoomLevel
		if (zoomLevel >= minZoom && zoomLevel <= maxZoom) {
			FVMap.setZoom(zoomLevel);
		}
	};
		
	$.fn.fanvenues.filter = function (min, max) {
		for (t in fvTicketList) {
			var section = fvTicketList[t];
			minP = min; maxP = max;
			if ($.inArray(t, sectionSelected) < 0) {
				if (section.section != undefined) {		// this ticket is on map
					if ((parseFloat(section.minPrice) > parseFloat(max)) || (parseFloat(section.maxPrice) < parseFloat(min))) {
						// hide polygon on map
						hidePolygon(sectionManager[t][0]);											
					}
					else {
						// show polygon on map
						showPolygon(sectionManager[t][0]);						
					}
				}
			}
		}
	};
	
	$.fn.fanvenues.focusSection = function (sectionName) {
		var sectionName = sanitizeSectionName(sectionName);
		if (sectionTranslator[sectionName] != undefined) {
			google.maps.event.trigger(sectionManager[sectionTranslator[sectionName]][0], "mousemove");
		}
		else {
			// assume user is passing in a section name not present in the ticket list, so format it as no translation can be done
			sectionName = sectionName.replace(' ', '-').toLowerCase();
			if (sectionManager[sectionName][0] != undefined) {
				google.maps.event.trigger(sectionManager[sectionName][0], "mousemove");
			}
		}
	};

	$.fn.fanvenues.blurSection = function (sectionName) {
		var sectionName = sanitizeSectionName(sectionName);
		if (sectionTranslator[sectionName] != undefined) {
			google.maps.event.trigger(sectionManager[sectionTranslator[sectionName]][0], "mouseout");
		}
		else {
			// assume user is passing in a section name not present in the ticket list, so format it as no translation can be done
			sectionName = sectionName.replace(' ', '-').toLowerCase();
			if (sectionManager[sectionName][0] != undefined) {
				google.maps.event.trigger(sectionManager[sectionName][0], "mouseout");
			}
		}
	};

	$.fn.fanvenues.clickSection = function (sectionName) {
		var sectionName = sanitizeSectionName(sectionName);
		if (sectionTranslator[sectionName] != undefined) {
			google.maps.event.trigger(sectionManager[sectionTranslator[sectionName]][0], "click");
		}
		else {
			// assume user is passing in a section name not present in the ticket list, so format it as no translation can be done
			sectionName = sectionName.replace(' ', '-').toLowerCase();
			if (sectionManager[sectionName][0] != undefined) {
				google.maps.event.trigger(sectionManager[sectionName][0], "click");
			}
		}
	};
	
	$.fn.fanvenues.getLargeImage = function (sectionName) {
		var sectionName = sanitizeSectionName(sectionName);
		if (sectionTranslator[sectionName] != undefined) {
			return fvTicketList[sectionTranslator[sectionName]].pic + "?size="+opts.lsize;
		}
		else {
			sectionName = sectionName.replace(' ', '-').toLowerCase();
			if (sectionManager[sectionName][0] != undefined) {
				return fvTicketList[sectionName].pic + "?size="+opts.lsize;
			}
		}
	};

	$.fn.fanvenues.getSmallImage = function (sectionName) {
		var sectionName = sanitizeSectionName(sectionName);
		if (sectionTranslator[sectionName] != undefined) {
			return fvTicketList[sectionTranslator[sectionName]].pic + "?size="+opts.ssize;
		}
		else {
			sectionName = sectionName.replace(' ', '-').toLowerCase();
			if (sectionManager[sectionName][0] != undefined) {
				return fvTicketList[sectionName].pic + "?size="+opts.ssize;
			}
		}
	};

	
	$.fn.fanvenues.getAllSections = function () {
		var allSections = [];
		for (i in fvTicketList) {
			allSections.push(i);
		}
		return allSections;
	};

	
	//
	// plugin defaults
	//
	$.fn.fanvenues.defaults = {
		version:'2.1.5',		// current Fanvenues version
		defaultZoom : 2,
		height: 500,
		width: 500,
		mapSet: 'fv',			// default map set
		mapId: '1004',			// default map (united center)
		ticketList: {},			// broker ticket list in well-formed JSON format (all available tickets on current page)
								// ticketList:{
								// 	'201':[{row:'10', price:'109.00', notes:'n/a'},{row:'12',price:'24.00',notes:'n/a'}],
								// 	'CL 202':[{row:'4', price:'50.00',notes:'n/a'}]
								// }
		rowSelector: '#tixlist div.tixlist-row', 	// jQuery row selector
		sectionSelector: '.psection',				// jQuery section selector
		rowsToHideOnFilterSelector: '#tbl .pHeader', 	// jQuery rows-to-hide selector when selecting tickets
		zoomMapButton: true,
		fullscreenMapButton: true,	
		centerMapButton: true,
		resetMapButton: true,
		closeAllBubblesButton: true,	
		printMapButton: true,
		priceFilter: true,
		interactWithTicketList: true,
		custom3d: 'fanvenues',
		scrollWheelZoom: false,
		lsize: '745x400',		// default size for enlarged image
		ssize: '175x94',		// default size for thumbnail image
		onReceiveVenueData: function (event, data, l, mapBaseUrl) {
		    layout_id = l;
  		    mapBaseUrl = "http://fanvenues3.appspot.com";   /* PLEASE EDIT THIS AFTER ALL CUSTOMERS HAVE MIGRATED TO LATEST SCRIPT */
		    mapTilesUrl = mapBaseUrl + "/tile/" + layout_id + "/";
			fvTicketList = data;		// raw venue data from fanvenues
			loadFVMap(this);
			mapTicketList(this);
			if (opts.interactWithTicketList)
				createInteractionWithTicketList(this);
				
			// create the map ui
			var actionListContainer = document.createElement('ul');
			var actionList = new ActionList(actionListContainer, this);
			FVMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(actionListContainer);
			
			if (opts.priceFilter) {
				var priceFilterContainer = document.createElement('div');
				var priceFilter = new PriceFilter(priceFilterContainer);
				FVMap.controls[google.maps.ControlPosition.BOTTOM].push(priceFilterContainer);
			}

			if (opts.zoomMapButton) {
				var actionListContainer = document.createElement('ul');
				var actionList = new ZoomList(actionListContainer);
				FVMap.controls[google.maps.ControlPosition.LEFT].push(actionListContainer);
			}

			// Create the DIV to hold the copyrightInfo control
			var copyrightInfoContainer = document.createElement('div');
			var copyrightInfo = new CopyrightInfo(copyrightInfoContainer);
			FVMap.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(copyrightInfoContainer);
		},
		onReceiveSectionData: function (event, data) {
		    if (data != "NA") {
		        var temp = data;
		        for (s in temp) {
					var sInfo = s.split('**');
					var sectionName = sanitizeSectionName(s.split('**')[0]);
					var sectionPrice = 0;
					if (sInfo.length > 1)
						var sectionPrice = parseFloat(s.split('**')[1]);
					sectionTranslator[sectionName] = temp[s];
					if (fvTicketList[sectionTranslator[sectionName]] == undefined) {
						continue;
					}
					fvTicketList[sectionTranslator[sectionName]].section = sectionName;
					for (var i=0; i< opts.ticketList.items.length; i++) {
						var item = opts.ticketList.items[i];
						if (item.section.toLowerCase() == sectionName.toLowerCase()) {
							if (fvTicketList[sectionTranslator[sectionName]].sections == undefined)
								fvTicketList[sectionTranslator[sectionName]].sections = [item];
							else
								fvTicketList[sectionTranslator[sectionName]].sections.push(item);
						}
					}
					if (fvTicketList[sectionTranslator[sectionName]].minPrice == undefined) {
						fvTicketList[sectionTranslator[sectionName]].minPrice = sectionPrice;
						fvTicketList[sectionTranslator[sectionName]].maxPrice = sectionPrice;
					}
					else {
						if (sectionPrice < fvTicketList[sectionTranslator[sectionName]].minPrice) {
							fvTicketList[sectionTranslator[sectionName]].minPrice = sectionPrice;
						}	
						if (sectionPrice > fvTicketList[sectionTranslator[sectionName]].maxPrice) {
							fvTicketList[sectionTranslator[sectionName]].maxPrice = sectionPrice;
						}
					}
		        }
				// initialize polygons for every section
				var $this = $(this);
				if ($this.find('.section.focus').css('color') != null) {
			        polyHoverFillColor = convertRGBToHex($this.find('.section.focus').css('color'));
			    }
				if ($this.find('.section.focus').css('opacity') != null) {
			        polyHoverFillOpacity = parseFloat($this.find('.section.focus').css('opacity'));
			    }
				if ($this.find('.section.available').css('color') != null) {
                    polyTixFillColor = convertRGBToHex($this.find('.section.available').css('color'));
                }
				if ($this.find('.section.available').css('opacity') != null) {
                    polyTixFillOpacity = parseFloat($this.find('.section.available').css('opacity'));
                }
				if ($this.find('.section.selected').css('color') != null) {
                    polyTixSelectedFillColor = convertRGBToHex($this.find('.section.selected').css('color'));
                }
				if ($this.find('.section.selected').css('opacity') != null) {
                    polyTixSelectedFillOpacity = parseFloat($this.find('.section.selected').css('opacity'));
                }

	            for (id in fvTicketList) {
					initSection(id, this);
				}
				
				// load priceFilter
				if (opts.priceFilter) {
					loadPriceFilter($this);
				}
				$this.trigger('fvmapReady'); 	// trigger 'ready' callback

				temp = null;
		    }
		}
	};
})(jQuery);
