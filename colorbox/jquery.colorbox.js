/*
	ColorBox v1.2.9b - a full featured, light-weight, customizable lightbox based on jQuery 1.3
	(c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
	Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
(function ($) {
	
	// ****************
	// COMMON VARIABLES
	// ****************
	
	//jQuery Object Variables
	var $overlay, $cbox, $wrap, $content, $topBorder, $leftBorder, $rightBorder, $bottomBorder, $related, $window, $loaded, $loadingOverlay, $loadingGraphic, $title, $current, $slideshow, $next, $prev, $close,
	
	//Variables
	publicMethod, interfaceHeight, interfaceWidth, loadedHeight, loadedWidth, maxWidth, maxHeight, element, index, settings, open, callback, colorbox = 'colorbox', hover = 'hover',

	//Functions
	prev, next, init, load, position, dimensions, slideshow, close,
	
	//Events
	cbox_open = 'cbox_open', cbox_load = 'cbox_load', cbox_complete = 'cbox_complete', cbox_close = 'cbox_close', cbox_closed = 'cbox_closed',

	// ColorBox Default Settings.	
	// See http://colorpowered.com/colorbox for details.
	defaults = {
		transition: "elastic",
		speed: 350,
		width: false,
		height: false,
		initialWidth: "400",
		initialHeight: "400",
		maxWidth: false,
		maxHeight: false,
		resize: true,
		inline: false,
		html: false,
		iframe: false,
		photo: false,
		href: false,
		title: false,
		rel: false,
		opacity: 0.9,
		preloading: true,
		current: "image {current} of {total}",
		previous: "previous",
		next: "next",
		close: "close",
		open: false,
		overlayClose: true,
		slideshow: false,
		slideshowAuto: true,
		slideshowSpeed: 2500,
		slideshowStart: "start slideshow",
		slideshowStop: "stop slideshow"
	};

	// ****************
	// HELPER FUNCTIONS
	// ****************
	
	// Set Navigation Keys
	function cbox_key(e) {
		if (e.keyCode === 37) {
			e.preventDefault();
			$prev.click();
		} else if (e.keyCode === 39) {
			e.preventDefault();
			$next.click();
		}
	}

	// Convert % values to pixels
	function setSize(size, dimension) {
		dimension = dimension === 'x' ? document.documentElement.clientWidth : document.documentElement.clientHeight;
		return (typeof size === 'string') ? (size.match(/%/) ? (dimension / 100) * parseInt(size, 10) : parseInt(size, 10)) : size;
	}

	// Checks an href to see if it is a photo.
	// There is a force photo option for hrefs that cannot be matched by this regex.
	function isImage(url) {
		return settings.photo ? true : url.match(/\.(gif|png|jpg|jpeg|bmp)(?:\?([^#]*))?(?:#(\.*))?$/i);
	}
	
	// Assigns functions results to their respective settings.  This allows functions to be used to set ColorBox options.
	function process() {
		for (var i in settings) {
			if (typeof(settings[i]) === 'function') {
			    settings[i] = settings[i].call(element);
			}
		}
	}

	$.fn.colorbox = function (options, custom_callback) {
		
		if (this.length) {
			this.each(function () {
				var data = $(this).data(colorbox) ? $.extend({},
					$(this).data(colorbox), options) : $.extend({}, defaults, options);
				$(this).data(colorbox, data).addClass("cboxelement");
			});
		} else {
			$(this).data(colorbox, $.extend({}, defaults, options));
		}
		
		$(this).unbind("click.colorbox").bind("click.colorbox", function (event) {
			
			element = this;
			
			settings = $(element).data(colorbox);
			
			process();//process settings functions
			
			$().bind("keydown.cbox_close", function (e) {
				if (e.keyCode === 27) {
					e.preventDefault();
					$close.click();
				}
			});
			if (settings.overlayClose === true) {
				$overlay.css({"cursor": "pointer"}).one('click', close);
			}
			
			//remove the focus from the anchor to prevent accidentally calling
			//colorbox multiple times (by pressing the 'Enter' key
			//after colorbox has opened, but before the user has clicked on anything else)
			element.blur();
			
			callback = custom_callback || false;
			
			var rel = settings.rel || element.rel;
			
			if (rel && rel !== 'nofollow') {
				$related = $('.cboxelement').filter(function () {
					var relRelated = $(this).data(colorbox).rel || this.rel;
					return (relRelated === rel);
				});
				index = $related.index(element);
				
				if (index < 0) { //this checks direct calls to colorbox
					$related = $related.add(element);
					index = $related.length - 1;
				}
			
			} else {
				$related = $(element);
				index = 0;
			}
			if (!open) {
				$.event.trigger(cbox_open);
				$close.html(settings.close);
				$overlay.css({"opacity": settings.opacity}).show();
				open = true;
				position(setSize(settings.initialWidth, 'x'), setSize(settings.initialHeight, 'y'), 0);
				if ($.browser.msie && $.browser.version < 7) {
					$window.bind("resize.cboxie6 scroll.cboxie6", function () {
						$overlay.css({width: $window.width(), height: $window.height(), top: $window.scrollTop(), left: $window.scrollLeft()});
					}).trigger('scroll.cboxie6');
				}
			}
			slideshow();
			load();
			
			event.preventDefault();
		});
		
		if (options && options.open) {
			$(this).triggerHandler('click.colorbox');
		}
		
		return this;
	};
	

	// Initialize ColorBox: store common calculations, preload the interface graphics, append the html.
	// This preps colorbox for a speedy open when clicked, and lightens the burdon on the browser by only
	// having to run once, instead of each time colorbox is opened.
	init = function () {				
		// jQuery object generator to save a bit of space
		function $div(id) {
			return $('<div id="cbox' + id + '"/>');
		}
		// Create & Append jQuery Objects
		$window = $(window);
		$cbox = $('<div id="colorbox"/>');
		$overlay = $div("Overlay").hide();
		$wrap = $div("Wrapper");
		$content = $div("Content").append(
			$loaded = $div("LoadedContent").css({width: 0, height: 0}),
			$loadingOverlay = $div("LoadingOverlay"),
			$loadingGraphic = $div("LoadingGraphic"),
			$title = $div("Title"),
			$current = $div("Current"),
			$slideshow = $div("Slideshow"),
			$next = $div("Next"),
			$prev = $div("Previous"),
			$close = $div("Close")
		);
		$wrap.append( // The 3x3 Grid that makes up ColorBox
			$('<div/>').append(
				$div("TopLeft"),
				$topBorder = $div("TopCenter"),
				$div("TopRight")
			),
			$('<div/>').append(
				$leftBorder = $div("MiddleLeft"),
				$content,
				$rightBorder = $div("MiddleRight")
			),
			$('<div/>').append(
				$div("BottomLeft"),
				$bottomBorder = $div("BottomCenter"),
				$div("BottomRight")
			)
		).children().children().css({'float': 'left'});
		$('body').prepend($overlay, $cbox.append($wrap));
		
		if ($.browser.msie && $.browser.version < 7) {
			$overlay.css('position', 'absolute');
		}
		
		// Add rollover event to navigation elements
		$content.children()
		.addClass(hover)
		.mouseover(function () { $(this).addClass(hover); })
		.mouseout(function () { $(this).removeClass(hover); })
		.hide();
		
		// Cache values needed for size calculations
		interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(true) - $content.height();//Subtraction needed for IE6
		interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(true) - $content.width();
		loadedHeight = $loaded.outerHeight(true);
		loadedWidth = $loaded.outerWidth(true);
		
		// Setting padding to remove the need to do size conversions during the animation step.
		$cbox.css({"padding-bottom": interfaceHeight, "padding-right": interfaceWidth}).hide();
		
		// Setup button & key events.
		$next.click(next);
		$prev.click(prev);
		$close.click(close);
		
		// Adding the 'hover' class allowed the browser to load the hover-state
		// background graphics.  The class can now can be removed.
		$content.children().removeClass(hover);
	};

	position = function (mWidth, mHeight, speed, loadedCallback) {
		var winHeight = document.documentElement.clientHeight,
		posTop = winHeight / 2 - mHeight / 2,
		posLeft = document.documentElement.clientWidth / 2 - mWidth / 2,
		animate_speed;
		
		//keeps the box from expanding to an inaccessible area offscreen.
		if (mHeight > winHeight) { posTop -=(mHeight - winHeight); }
		if (posTop < 0) { posTop = 0; } 
		if (posLeft < 0) { posLeft = 0; }
		
		posTop += $window.scrollTop();
		posLeft += $window.scrollLeft();
		
		mWidth = mWidth - interfaceWidth;
		mHeight = mHeight - interfaceHeight;
		
		//setting the speed to 0 to reduce the delay between same-sized content.
		animate_speed = ($cbox.width() === mWidth && $cbox.height() === mHeight) ? 0 : speed;
		
		//this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
		//but it has to be shrank down around the size of div#colorbox when it's done.  If not,
		//it can invoke an obscure IE bug when using iframes.
		$wrap[0].style.width = $wrap[0].style.height = "9999px";
		
		function modalDimensions (that) {
			//loading overlay size has to be sure that IE6 uses the correct height.
			$topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = that.style.width;
			$loadingGraphic[0].style.height = $loadingOverlay[0].style.height = $content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = that.style.height;
		}
		
		$cbox.dequeue().animate({height:mHeight, width:mWidth, top:posTop, left:posLeft}, {duration: animate_speed,
			complete: function(){
				modalDimensions(this);
				
				//shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
				$wrap[0].style.width = (mWidth+interfaceWidth) + "px";
				$wrap[0].style.height = (mHeight+interfaceHeight) + "px";
				
				if (loadedCallback) {loadedCallback();}
			},
			step: function(){
				modalDimensions(this);
			}
		});
	};

	dimensions = function (object) {
		if(!open){ return; }
		
		$window.unbind('resize.cbox_resize');
		
		var width, height, topMargin, prev, prevSrc, next, nextSrc, photo,
		speed = settings.transition==="none" ? 0 : settings.speed;
		
		$loaded.remove();
		$loaded = $(object);
		
		function getWidth(){
			if(settings.width){
				width = maxWidth;
			} else {
				width = maxWidth && maxWidth < $loaded.width() ? maxWidth : $loaded.width();
			}
			return width;
		}
		function getHeight(){
			if(settings.height){
				height = maxHeight;
			} else {
				height = maxHeight && maxHeight < $loaded.height() ? maxHeight : $loaded.height();
			}
			return height;
		}
		
		$loaded.hide().appendTo('body')
		.attr({id:'cboxLoadedContent'})
		.css({width:getWidth()})
		.css({height:getHeight()})//sets the height independently from the width in case the new width influences the value of height.
		.prependTo($content);
		
		
		// Hides 'select' form elements in IE6 because they would otherwise sit on top of the overlay.
		if ($.browser.msie && $.browser.version < 7) {
			$('select:not(#colorbox select)').filter(function(){
				return $(this).css('visibility') !== 'hidden';
			}).css({'visibility':'hidden'}).one(cbox_close, function(){
				$(this).css({'visibility':'inherit'});
			});
		}
		
		photo = $('#cboxPhoto')[0];
		if (photo && settings.height) {
			topMargin = (height - parseInt(photo.style.height, 10))/2;
			photo.style.marginTop = (topMargin > 0 ? topMargin : 0)+'px';
		}
		
		function setPosition (s) {
			var mWidth = width+loadedWidth+interfaceWidth,
			mHeight = height+loadedHeight+interfaceHeight;
			
			position(mWidth, mHeight, s, function(){
				if (!open) { return; }
				
				if ($.browser.msie) {
					//This fadeIn helps the bicubic resampling to kick-in.
					if( photo ){$loaded.fadeIn(100);}
					//IE adds a filter when ColorBox fades in and out that can cause problems if the loaded content contains transparent pngs.
					$cbox.css('filter','');
				}
				
				$content.children().show();
				
				//Waited until the iframe is added to the DOM & it is visible before setting the src.
				//This increases compatability with pages using DOM dependent JavaScript.
				$('#cboxIframeTemp').after("<iframe id='cboxIframe' name='iframe_"+new Date().getTime()+"' frameborder=0 src='"+(settings.href || element.href)+"' />").remove();
				
				$loadingOverlay.hide();
				$loadingGraphic.hide();
				$slideshow.hide();
				
				if ($related.length>1) {
					$current.html(settings.current.replace(/\{current\}/, index+1).replace(/\{total\}/, $related.length));
					$next.html(settings.next);
					$prev.html(settings.previous);
					
					$().unbind('keydown', cbox_key).bind('keydown', cbox_key);
					
					if(settings.slideshow){
						$slideshow.show();
					}
				} else {
					$current.hide();
					$next.hide();
					$prev.hide();
				}
				
				$title.html(settings.title || element.title);
				
				$.event.trigger(cbox_complete);
				
				if (callback) {
					callback.call(element);
				}
				
				if (settings.transition === 'fade'){
					$cbox.fadeTo(speed, 1, function(){
						if($.browser.msie){$content.css('filter','');}
					});
				}
				
				$window.bind('resize.cbox_resize', function(){
					position(mWidth, mHeight, 0);
				});
			});
		}
		if (settings.transition === 'fade') {
			$cbox.fadeTo(speed, 0, function(){setPosition(0);});
		} else {
			setPosition(speed);
		}
		
		// Preloads images within a rel group
		if (settings.preloading && $related.length>1) {
			prev = index > 0 ? $related[index-1] : $related[$related.length-1];
			next = index < $related.length-1 ? $related[index+1] : $related[0];
			nextSrc = $(next).data(colorbox).href || next.href;
			prevSrc = $(prev).data(colorbox).href || prev.href;
			
			if(isImage(nextSrc)){
				$('<img />').attr('src', nextSrc);
			}
			if(isImage(prevSrc)){
				$('<img />').attr('src', prevSrc);
			}
		}
	};

	load = function () {
		var height, width, href, loadingElement;

		element = $related[index];
		
		settings = $(element).data(colorbox);
		
		//convert functions to static values
		process();

		$.event.trigger(cbox_load);
		
		// Evaluate the height based on the optional height and width settings.
		height = settings.height ? setSize(settings.height, 'y') - loadedHeight - interfaceHeight : false;
		width = settings.width ? setSize(settings.width, 'x') - loadedWidth - interfaceWidth : false;
		
		href = settings.href || element.href;
		
		$loadingOverlay.show();
		$loadingGraphic.show();
		$close.show();
		
		//Re-evaluate the maximum dimensions based on the optional maxheight and maxwidth.
		if(settings.maxHeight){
			maxHeight = settings.maxHeight ? setSize(settings.maxHeight, 'y') - loadedHeight - interfaceHeight : false;
			height = height && height < maxHeight ? height : maxHeight;
		}
		if(settings.maxWidth){
			maxWidth = settings.maxWidth ? setSize(settings.maxWidth, 'x') - loadedWidth - interfaceWidth : false;
			width = width && width < maxWidth ? width : maxWidth;
		}
		
		maxHeight = height;
		maxWidth = width;
		
		if (settings.inline) {
			$('<div id="cboxInlineTemp" />').hide().insertBefore($(href)[0]).bind(cbox_load+' '+cbox_close, function(){
				$loaded.children().insertBefore(this);
				$(this).remove();
			});
			dimensions($(href).wrapAll('<div/>').parent());
		} else if (settings.iframe) {
			dimensions(
				$("<div><div id='cboxIframeTemp' /></div>")
			);//timestamp to prevent caching.
		} else if (settings.html) {
			dimensions(
				$('<div/>').html(settings.html)
			);
		} else if (isImage(href)){
			loadingElement = new Image();
			loadingElement.onload = function(){
				loadingElement.onload = null;
				
				if((maxHeight || maxWidth) && settings.resize){
					var width = this.width,
					height = this.height,
					percent = 0,
					that = this,
					setResize = function(){
						height += height * percent;
						width += width * percent;
						that.height = height;
						that.width = width;	
					};
					
					if( maxWidth && width > maxWidth ){
						percent = (maxWidth - width) / width;
						setResize();
					}
					if( maxHeight && height > maxHeight ){
						percent = (maxHeight - height) / height;
						setResize();
					}
				}
				dimensions($("<div />").css({width:this.width, height:this.height}).append($(this).css({width:this.width, height:this.height, display:"block", margin:"auto", border:0}).attr('id', 'cboxPhoto')));
				if($related.length > 1){
					$(this).css({cursor:'pointer'}).click(next);
				}
				if($.browser.msie && $.browser.version == 7){
					this.style.msInterpolationMode='bicubic';
				}
			};
			loadingElement.src = href;
		} else {
			$('<div />').load(href, function(data, textStatus){
				if(textStatus === "success"){
					dimensions($(this));
				} else {
					dimensions($("<p>Request unsuccessful.</p>"));
				}
			});
		}	
	};

	//navigates to the next page/image in a set.
	next = function () {
		index = index < $related.length-1 ? index+1 : 0;
		load();
	};
	
	prev = function () {
		index = index > 0 ? index-1 : $related.length-1;
		load();
	};

	slideshow = function () {
		var stop, timeOut, className = 'cboxSlideshow_';
		
		$slideshow.bind(cbox_close, function(){
			clearTimeout(timeOut);
			$slideshow.unbind();
		});
		
		function start(){
			$slideshow
			.text(settings.slideshowStop)
			.bind(cbox_complete, function(){
				timeOut = setTimeout(next, settings.slideshowSpeed);
			})
			.bind(cbox_load, function(){
				clearTimeout(timeOut);	
			}).one("click", function(){
				stop();
				$(this).removeClass(hover);
			});
			$cbox.removeClass(className+"off").addClass(className+"on");
		}
		
		stop = function(){
			clearTimeout(timeOut);
			$slideshow
			.text(settings.slideshowStart)
			.unbind(cbox_complete+' '+cbox_load)
			.one("click", function(){
				start();
				timeOut = setTimeout(next, settings.slideshowSpeed);
				$(this).removeClass(hover);
			});
			$cbox.removeClass(className+"on").addClass(className+"off");
		};
		
		if(settings.slideshow && $related.length>1){
			if(settings.slideshowAuto){
				start();
			} else {
				stop();
			}
		}
	};

	//public function for closing colorbox.  To use this within an iframe use the following format: parent.$.fn.colorbox.close();
	close = function () {
		$.event.trigger(cbox_close);
		open = false;
		$().unbind('keydown', cbox_key).unbind("keydown.cbox_close");
		$window.unbind('resize.cbox_resize resize.cboxie6 scroll.cboxie6');
		$overlay.css({cursor:'auto'}).fadeOut('fast');
		
		$cbox
		.stop(true, false)
		.removeClass()
		.fadeOut('fast', function(){
			$loaded.remove();
			$cbox.css({'opacity':1});
			$content.children().hide();
			$.event.trigger(cbox_closed);
		});
	};

	// Create Public Methods
	publicMethod = $.fn.colorbox;
	publicMethod.init = init;
	publicMethod.next = next;
	publicMethod.prev = prev;
	publicMethod.close = close;
	publicMethod.load = load;
	publicMethod.position = position;
	publicMethod.dimensions = dimensions;
	publicMethod.element = function(){ return element; };
	publicMethod.settings = defaults;

	// Initializes ColorBox when the DOM has loaded
	$(function () {
		init();
	});

}(jQuery));
