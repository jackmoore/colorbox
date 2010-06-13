// ColorBox v1.3.7 - a full featured, light-weight, customizable lightbox based on jQuery 1.3
// c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

/*jslint browser: true */

(function ($) {
	// Shortcuts (to increase compression)
	var colorbox = 'colorbox',
	hover = 'hover',
	TRUE = true,
	FALSE = false,
	cboxPublic,
	isIE = $.browser.msie && !$.support.opacity, // feature detection alone gave a false positive on at least one phone browser
	isIE6 = isIE && $.browser.version < 7,

	// Event Strings (to increase compression)
	cbox_open = 'cbox_open',
	cbox_load = 'cbox_load',
	cbox_complete = 'cbox_complete',
	cbox_cleanup = 'cbox_cleanup',
	cbox_closed = 'cbox_closed',

	// Cached jQuery Object Variables
	$overlay,
	$cbox,
	$wrap,
	$content,
	$topBorder,
	$leftBorder,
	$rightBorder,
	$bottomBorder,
	$related,
	$window,
	$loaded,
	$loadingBay,
	$loadingOverlay,
	$title,
	$current,
	$slideshow,
	$next,
	$prev,
	$close,

	// Variables for cached values or use across multiple functions
	interfaceHeight,
	interfaceWidth,
	loadedHeight,
	loadedWidth,
	element,
	bookmark,
	index,
	settings,
	open,
	active,
	
	// ColorBox Default Settings.	
	// See http://colorpowered.com/colorbox for details.
	defaults = {
		transition: "elastic",
		speed: 350,
		width: FALSE,
		height: FALSE,
		innerWidth: FALSE,
		innerHeight: FALSE,
		initialWidth: "400",
		initialHeight: "400",
		maxWidth: FALSE,
		maxHeight: FALSE,
		scalePhotos: TRUE,
		scrolling: TRUE,
		inline: FALSE,
		html: FALSE,
		iframe: FALSE,
		photo: FALSE,
		href: FALSE,
		title: FALSE,
		rel: FALSE,
		opacity: 0.9,
		preloading: TRUE,
		current: "image {current} of {total}",
		previous: "previous",
		next: "next",
		close: "close",
		open: FALSE,
		overlayClose: TRUE,
		loop: TRUE,
		
		slideshow: FALSE,
		slideshowAuto: TRUE,
		slideshowSpeed: 2500,
		slideshowStart: "start slideshow",
		slideshowStop: "stop slideshow",
		
		onOpen: FALSE,
		onLoad: FALSE,
		onComplete: FALSE,
		onCleanup: FALSE,
		onClosed: FALSE,
		
		escKey: TRUE,
		arrowKey: TRUE
	};
	
	// ****************
	// HELPER FUNCTIONS
	// ****************
		
	// Convert % values to pixels
	function setSize(size, dimension) {
		dimension = dimension === 'x' ? $window.width() : $window.height();//document.documentElement.clientWidth : document.documentElement.clientHeight;
		return (typeof size === 'string') ? Math.round((size.match(/%/) ? (dimension / 100) * parseInt(size, 10) : parseInt(size, 10))) : size;
	}

	// Checks an href to see if it is a photo.
	// There is a force photo option (photo: true) for hrefs that cannot be matched by this regex.
	function isImage(url) {
		url = $.isFunction(url) ? url.call(element) : url;
		return settings.photo || url.match(/\.(gif|png|jpg|jpeg|bmp)(?:\?([^#]*))?(?:#(\.*))?$/i);
	}
	
	// Assigns functions results to their respective settings.  This allows functions to be used to set ColorBox options.
	function process() {
		for (var i in settings) {
			if ($.isFunction(settings[i]) && i.substring(0, 2) !== 'on') { // checks to make sure the function isn't one of the callbacks, they will be handled at the appropriate time.
			    settings[i] = settings[i].call(element);
			}
		}
		settings.rel = settings.rel || element.rel || 'nofollow';
		settings.href = settings.href || $(element).attr('href');
		settings.title = settings.title || element.title;
	}

	function launch(elem) {
		
		element = elem;
		
		settings = $.extend({}, $(element).data(colorbox));
		
		process(); // Convert functions to their returned values.
		
		if (settings.rel !== 'nofollow') {
			$related = $('.cboxElement').filter(function () {
				var relRelated = $(this).data(colorbox).rel || this.rel;
				return (relRelated === settings.rel);
			});
			index = $related.index(element);
			
			// Check direct calls to ColorBox.
			if (index < 0) {
				$related = $related.add(element);
				index = $related.length - 1;
			}
		} else {
			$related = $(element);
			index = 0;
		}
		
		if (!open) {
			open = TRUE;
			
			active = TRUE; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.
			
			bookmark = element;
			
			try {
				bookmark.blur(); // Remove the focus from the calling element.
			}catch (e) {}
			
			$.event.trigger(cbox_open);
			if (settings.onOpen) {
				settings.onOpen.call(element);
			}
			
			$overlay.css({"opacity": parseFloat(settings.opacity), "cursor": settings.overlayClose ? "pointer" : "auto"}).show();
			
			// Opens inital empty ColorBox prior to content being loaded.
			settings.w = setSize(settings.initialWidth, 'x');
			settings.h = setSize(settings.initialHeight, 'y');
			cboxPublic.position(0);
			
			if (isIE6) {
				$window.bind('resize.cboxIE6 scroll.cboxIE6', function () {
					$overlay.css({width: $window.width(), height: $window.height(), top: $window.scrollTop(), left: $window.scrollLeft()});
				}).trigger("scroll.cboxIE6");
			}
		}
		
		$current.add($prev).add($next).add($slideshow).add($title).hide();
		
		$close.html(settings.close).show();
		
		cboxPublic.slideshow();
		
		cboxPublic.load();
	}

	// ****************
	// PUBLIC FUNCTIONS
	// Usage format: $.fn.colorbox.close();
	// Usage from within an iframe: parent.$.fn.colorbox.close();
	// ****************
	
	cboxPublic = $.fn.colorbox = $.colorbox = function (options, callback) {
		var $this = this;
		
		if ($this.selector && !$this.length) {
			return $this;
		}
		
		options = options || {};
		
		if (callback) {
			options.onComplete = callback;
		}
		
		if (!$this.length || $this.selector === undefined) { // detects $.colorbox() and $.fn.colorbox()
			$this = $('<a/>');
			options.open = TRUE; // assume an immediate open
		}
		
		$this.each(function () {
			$(this).data(colorbox, $.extend({}, $(this).data(colorbox) || defaults, options)).addClass("cboxElement");
		});
		
		if (options.open) {
			launch($this[0]);
		}
		
		return $this;
	};

	// Initialize ColorBox: store common calculations, preload the interface graphics, append the html.
	// This preps colorbox for a speedy open when clicked, and lightens the burdon on the browser by only
	// having to run once, instead of each time colorbox is opened.
	cboxPublic.init = function () {
		
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
			$loadingOverlay = $div("LoadingOverlay").add($div("LoadingGraphic")),
			$title = $div("Title"),
			$current = $div("Current"),
			$next = $div("Next"),
			$prev = $div("Previous"),
			$slideshow = $div("Slideshow"),
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
		
		$loadingBay = $("<div id='cboxLoadingBay' style='position:absolute; width:9999px;'/>");
		
		$('body').prepend($overlay, $cbox.append($wrap, $loadingBay));
				
		if (isIE) {
			$cbox.addClass('cboxIE');
			if (isIE6) {
				$overlay.css('position', 'absolute');
			}
		}
		
		$content.children()
		.hover(function () {
			$(this).addClass(hover);
		}, function () {
			$(this).removeClass(hover);
		}).addClass(hover);
		
		// Cache values needed for size calculations
		interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(TRUE) - $content.height();//Subtraction needed for IE6
		interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(TRUE) - $content.width();
		loadedHeight = $loaded.outerHeight(TRUE);
		loadedWidth = $loaded.outerWidth(TRUE);
		
		// Setting padding to remove the need to do size conversions during the animation step.
		$cbox.css({"padding-bottom": interfaceHeight, "padding-right": interfaceWidth}).hide();
		
		// Setup button events.
		$next.click(cboxPublic.next);
		$prev.click(cboxPublic.prev);
		$close.click(cboxPublic.close);
		
		// Adding the 'hover' class allowed the browser to load the hover-state
		// background graphics.  The class can now can be removed.
		$content.children().removeClass(hover);
		
		$('.cboxElement').live('click', function (e) {
			// checks to see if it was a non-left mouse-click and for clicks modified with ctrl, shift, or alt.
			if ((e.button !== 0 && typeof e.button !== 'undefined') || e.ctrlKey || e.shiftKey || e.altKey) {
				return TRUE;
			} else {
				launch(this);			
				return FALSE;
			}
		});
		
		$overlay.click(function () {
			if (settings.overlayClose) {
				cboxPublic.close();
			}
		});
		
		// Set Navigation Key Bindings
		$(document).bind("keydown", function (e) {
			if (open && settings.escKey && e.keyCode === 27) {
				e.preventDefault();
				cboxPublic.close();
			}
			if (open && settings.arrowKey && !active && $related.length > 1) {
				if (e.keyCode === 37 && (index > 0 || settings.loop)) {
					e.preventDefault();
					$prev.click();
				} else if (e.keyCode === 39 && (index < $related.length - 1 || settings.loop)) {
					e.preventDefault();
					$next.click();
				}
			}
		});
	};
	
	cboxPublic.remove = function () {
		$cbox.add($overlay).remove();
		$('.cboxElement').removeData(colorbox).removeClass('cboxElement');
	};

	cboxPublic.position = function (speed, loadedCallback) {
		var
		animate_speed,
		// keeps the top and left positions within the browser's viewport.
		posTop = Math.max($window.height() - settings.h - loadedHeight - interfaceHeight, 0) / 2 + $window.scrollTop(),
		posLeft = Math.max($window.width() - settings.w - loadedWidth - interfaceWidth, 0) / 2 + $window.scrollLeft();
		
		// setting the speed to 0 to reduce the delay between same-sized content.
		animate_speed = ($cbox.width() === settings.w + loadedWidth && $cbox.height() === settings.h + loadedHeight) ? 0 : speed;
		
		// this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
		// but it has to be shrank down around the size of div#colorbox when it's done.  If not,
		// it can invoke an obscure IE bug when using iframes.
		$wrap[0].style.width = $wrap[0].style.height = "9999px";
		
		function modalDimensions(that) {
			// loading overlay height has to be explicitly set for IE6.
			$topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = that.style.width;
			$loadingOverlay[0].style.height = $loadingOverlay[1].style.height = $content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = that.style.height;
		}
		
		$cbox.dequeue().animate({width: settings.w + loadedWidth, height: settings.h + loadedHeight, top: posTop, left: posLeft}, {
			duration: animate_speed,
			complete: function () {
				modalDimensions(this);
				
				active = FALSE;
				
				// shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
				$wrap[0].style.width = (settings.w + loadedWidth + interfaceWidth) + "px";
				$wrap[0].style.height = (settings.h + loadedHeight + interfaceHeight) + "px";
				
				if (loadedCallback) {
					loadedCallback();
				}
			},
			step: function () {
				modalDimensions(this);
			}
		});
	};

	cboxPublic.resize = function (options) {
		if (open) {
			options = options || {};
			
			if (options.width) {
				settings.w = setSize(options.width, 'x') - loadedWidth - interfaceWidth;
			}
			if (options.innerWidth) {
				settings.w = setSize(options.innerWidth, 'x');
			}
			$loaded.css({width: settings.w});
			
			if (options.height) {
				settings.h = setSize(options.height, 'y') - loadedHeight - interfaceHeight;
			}
			if (options.innerHeight) {
				settings.h = setSize(options.innerHeight, 'y');
			}
			if (!options.innerHeight && !options.height) {				
				var $child = $loaded.wrapInner("<div style='overflow:auto'></div>").children(); // temporary wrapper to get an accurate estimate of just how high the total content should be.
				settings.h = $child.height();
				$child.replaceWith($child.children()); // ditch the temporary wrapper div used in height calculation
			}
			$loaded.css({height: settings.h});
			
			cboxPublic.position(settings.transition === "none" ? 0 : settings.speed);
		}
	};

	cboxPublic.prep = function (object) {
		if (!open) {
			return;
		}
		
		var photo,
		speed = settings.transition === "none" ? 0 : settings.speed;
		
		$window.unbind('resize.cbox');
		
		$loaded.remove();
		$loaded = $('<div id="cboxLoadedContent"/>').html(object);
		
		function getWidth() {
			settings.w = settings.w || $loaded.width();
			settings.w = settings.mw && settings.mw < settings.w ? settings.mw : settings.w;
			return settings.w;
		}
		function getHeight() {
			settings.h = settings.h || $loaded.height();
			settings.h = settings.mh && settings.mh < settings.h ? settings.mh : settings.h;
			return settings.h;
		}
		
		$loaded.hide()
		.appendTo($loadingBay)// content has to be appended to the DOM for accurate size calculations.
		.css({width: getWidth(), overflow: settings.scrolling ? 'auto' : 'hidden'})
		.css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
		.prependTo($content);
		
		$('#cboxPhoto').css({cssFloat: 'none'});// floating the IMG removes the bottom line-height and fixed a problem where IE miscalculates the width of the parent element as 100% of the document width.
		
		// Hides SELECT elements in IE6 because they would otherwise sit on top of the overlay.
		if (isIE6) {
			$('select:not(#colorbox select)').filter(function () {
				return this.style.visibility !== 'hidden';
			}).css({'visibility': 'hidden'}).one(cbox_cleanup, function () {
				this.style.visibility = 'inherit';
			});
		}
				
		function setPosition(s) {
			var prev, prevSrc, next, nextSrc, total = $related.length, loop = settings.loop;
			cboxPublic.position(s, function () {
				function defilter() {
					if (isIE) {
						//IE adds a filter when ColorBox fades in and out that can cause problems if the loaded content contains transparent pngs.
						$cbox[0].style.removeAttribute("filter");
					}
				}
				
				if (!open) {
					return;
				}
				
				if (isIE) {
					//This fadeIn helps the bicubic resampling to kick-in.
					if (photo) {
						$loaded.fadeIn(100);
					}
				}
				
				//Waited until the iframe is added to the DOM & it is visible before setting the src.
				//This increases compatability with pages using DOM dependent JavaScript.
				if (settings.iframe) {
					$("<iframe frameborder=0" + (settings.scrolling ? "" : " scrolling='no'") + (isIE ? " allowtransparency='true'" : '') + "/>")
					.appendTo($loaded)
					.attr({src: settings.href, id: 'cboxIframe', name: new Date().getTime()});
				}
				
				$loaded.show();
				
				$title.show().html(settings.title);
				
				if (total > 1) { // handle grouping
					$current.html(settings.current.replace(/\{current\}/, index + 1).replace(/\{total\}/, total)).show();
					
					$next[(loop || index < total - 1) ? "show" : "hide"]().html(settings.next);
					$prev[(loop || index > 0) ? "show" : "hide"]().html(settings.previous);
					
					prev = index > 0 ? $related[index - 1] : $related[total - 1];
					next = index < total - 1 ? $related[index + 1] : $related[0];
					
					if (settings.slideshow) {
						$slideshow.show();
						if (index === total - 1 && !loop && $cbox.is('.cboxSlideshow_on')) {
							$slideshow.click();
						}
					}
					
					// Preloads images within a rel group
					if (settings.preloading) {
						nextSrc = $(next).data(colorbox).href || next.href;
						prevSrc = $(prev).data(colorbox).href || prev.href;
						
						if (isImage(nextSrc)) {
							$('<img/>')[0].src = nextSrc;
						}
						
						if (isImage(prevSrc)) {
							$('<img/>')[0].src = prevSrc;
						}
					}
				}
				
				$loadingOverlay.hide();
				
				if (settings.transition === 'fade') {
					$cbox.fadeTo(speed, 1, function () {
						defilter();
					});
				} else {
					defilter();
				}
				
				$window.bind('resize.cbox', function () {
					cboxPublic.position(0);
				});
				
				$.event.trigger(cbox_complete);
				if (settings.onComplete) {
					settings.onComplete.call(element);
				}
			});
		}
		
		if (settings.transition === 'fade') {
			$cbox.fadeTo(speed, 0, function () {
				setPosition(0);
			});
		} else {
			setPosition(speed);
		}
	};

	cboxPublic.load = function () {
		var href, img, setResize, prep = cboxPublic.prep;
		
		active = TRUE;
		
		element = $related[index];
		
		settings = $.extend({}, $(element).data(colorbox));
		
		//convert functions to static values
		process();
		
		$.event.trigger(cbox_load);
		if (settings.onLoad) {
			settings.onLoad.call(element);
		}
		
		// Evaluate the height based on the optional height and width settings.
		settings.h = settings.height ?
				setSize(settings.height, 'y') - loadedHeight - interfaceHeight :
				settings.innerHeight ?
					setSize(settings.innerHeight, 'y') :
					FALSE;
		settings.w = settings.width ?
				setSize(settings.width, 'x') - loadedWidth - interfaceWidth :
				settings.innerWidth ?
					setSize(settings.innerWidth, 'x') :
					FALSE;
		
		// Sets the minimum dimensions for use in image scaling
		settings.mw = settings.w;
		settings.mh = settings.h;
		
		// Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
		// If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
		if (settings.maxWidth) {
			settings.mw = setSize(settings.maxWidth, 'x') - loadedWidth - interfaceWidth;
			settings.mw = settings.w && settings.w < settings.mw ? settings.w : settings.mw;
		}
		if (settings.maxHeight) {
			settings.mh = setSize(settings.maxHeight, 'y') - loadedHeight - interfaceHeight;
			settings.mh = settings.h && settings.h < settings.mh ? settings.h : settings.mh;
		}
		
		href = settings.href;
		
		$loadingOverlay.show();
		
		if (settings.inline) {
			// Inserts an empty placeholder where inline content is being pulled from.
			// An event is bound to put inline content back when ColorBox closes or loads new content.
			$('<div id="cboxInlineTemp"/>').hide().insertBefore($(href)[0]).bind(cbox_load + ' ' + cbox_cleanup, function () {
				$(this).replaceWith($loaded.children());
			});
			prep($(href));
		} else if (settings.iframe) {
			// IFrame element won't be added to the DOM until it is ready to be displayed,
			// to avoid problems with DOM-ready JS that might be trying to run in that iframe.
			prep(" ");
		} else if (settings.html) {
			prep(settings.html);
		} else if (isImage(href)) {
			img = new Image();
			img.onload = function () {
				var percent;
				
				img.onload = null;
				img.id = 'cboxPhoto';
				$(img).css({margin: 'auto', border: 'none', display: 'block', cssFloat: 'left'});
				
				if (settings.scalePhotos) {
					setResize = function () {
						img.height -= img.height * percent;
						img.width -= img.width * percent;	
					};
					if (settings.mw && img.width > settings.mw) {
						percent = (img.width - settings.mw) / img.width;
						setResize();
					}
					if (settings.mh && img.height > settings.mh) {
						percent = (img.height - settings.mh) / img.height;
						setResize();
					}
				}
				
				if (settings.h) {
					img.style.marginTop = Math.max(settings.h - img.height, 0) / 2 + 'px';
				}
				
				prep(img);
				
				if ($related.length > 1) {
					$(img).css({cursor: 'pointer'}).click(cboxPublic.next);
				}
				
				if (isIE) {
					img.style.msInterpolationMode = 'bicubic';
				}
			};
			img.src = href;
		} else {
			$('<div>Request unsuccessful.</div>').appendTo($loadingBay).load(href, function (data, textStatus) {
				prep(this);
			});
		}
	};

	// Navigates to the next page/image in a set.
	cboxPublic.next = function () {
		if (!active) {
			index = index < $related.length - 1 ? index + 1 : 0;
			cboxPublic.load();
		}
	};
	
	cboxPublic.prev = function () {
		if (!active) {
			index = index > 0 ? index - 1 : $related.length - 1;
			cboxPublic.load();
		}
	};

	cboxPublic.slideshow = function () {
		var stop, timeOut, className = 'cboxSlideshow_';
		
		$slideshow.bind(cbox_closed, function () {
			$slideshow.unbind();
			clearTimeout(timeOut);
			$cbox.removeClass(className + "off " + className + "on");
		});
		
		function start() {
			$slideshow
			.text(settings.slideshowStop)
			.bind(cbox_complete, function () {
				timeOut = setTimeout(cboxPublic.next, settings.slideshowSpeed);
			})
			.bind(cbox_load, function () {
				clearTimeout(timeOut);	
			}).one("click", function () {
				stop();
			});
			$cbox.removeClass(className + "off").addClass(className + "on");
		}
		
		stop = function () {
			clearTimeout(timeOut);
			$slideshow
			.text(settings.slideshowStart)
			.unbind(cbox_complete + ' ' + cbox_load)
			.one("click", function () {
				start();
				timeOut = setTimeout(cboxPublic.next, settings.slideshowSpeed);
			});
			$cbox.removeClass(className + "on").addClass(className + "off");
		};
		
		if (settings.slideshow && $related.length > 1) {
			if (settings.slideshowAuto) {
				start();
			} else {
				stop();
			}
		}
	};

	// Note: to use this within an iframe use the following format: parent.$.fn.colorbox.close();
	cboxPublic.close = function () {
		if (open) {
			open = FALSE;
			
			$.event.trigger(cbox_cleanup);
			
			if (settings.onCleanup) {
				settings.onCleanup.call(element);
			}
			
			$window.unbind('.cbox .cboxIE6');
			
			$cbox.add($overlay)
			.stop()
			.fadeTo('fast', 0, function () {
				$('#colorbox iframe').attr('src', 'about:blank'); // change the location of the iframe to avoid a problem in IE with flash objects not clearing.
				
				$loaded.remove();
				
				$cbox.add($overlay).css({'opacity': 1, cursor: 'auto'}).hide();
				
				try {
					bookmark.focus();
				} catch (e) {
					// do nothing
				}
				
				setTimeout(function () {
					$.event.trigger(cbox_closed);
					if (settings.onClosed) {
						settings.onClosed.call(element);
					}
				}, 1);
			});
		}
	};

	// A method for fetching the current element ColorBox is referencing.
	// returns a jQuery object.
	cboxPublic.element = function () {
		return $(element);
	};

	cboxPublic.settings = defaults;

	// Initializes ColorBox when the DOM has loaded
	$(cboxPublic.init);

}(jQuery));
