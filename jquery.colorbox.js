/*!
	jQuery ColorBox v2.0.0-alpha
	(c) 2013 Jack Moore - jacklmoore.com/colorbox
	license: http://www.opensource.org/licenses/mit-license.php
*/

(function ($, document, window) {

	// Don't do anything if ColorBox already exists.
	if ($.colorbox) { return; }

	var
	// cached jQuery objects
	$root,
	$body,
	$content,

	// variables used across multiple functions
	cache = {},
	interfaceHeight,
	interfaceWidth,
	open,
	active,
	closing,
	size; // computed size


	// ****************
	// HELPER FUNCTIONS
	// ****************

	// Convert '%' and 'px' values to integers
	function setSize(size, dimension) {
		return Math.round((/%/.test(size) ? ((dimension === 'x' ? $(window).width() : $(window).height()) / 100) : 1) * parseInt(size, 10));
	}

	function launch(target) {
		if (!closing && document.body) {
			
			$.colorbox.element = target;

			if (!open) {
				open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.

				$root = $($.colorbox.getSetting('structure'));
				$body = $('.cbox-body', $root);
				$content = $('.cbox-content', $root);
				$root.appendTo(document.body);

				$(document.body).addClass('cbox_open');

				// Cache values needed for size calculations
				interfaceHeight = $body.outerHeight(true);
				interfaceWidth = $body.outerWidth(true);
				
				$root.css({visibility:'visible'});

				// Opens empty ColorBox prior to content being loaded.
				size = {};
				size.width = setSize($.colorbox.getSetting('initialWidth'), 'x');
				size.height = setSize($.colorbox.getSetting('initialHeight'), 'y');
				$.colorbox.position();
				
				$(document).trigger('cbox.open');
				$.colorbox.getSetting('onOpen');
				
				$('cbox-close').html($.colorbox.getSetting('close'));

				if ($.colorbox.getSetting('group')) {
					$.colorbox.group = $($.colorbox.getSetting('group'));

					$.colorbox.index = $.colorbox.group.index($.colorbox.element);

					if ($.colorbox.index === -1) {
						$.colorbox.group = $.colorbox.group.add($.colorbox.element);
						$.colorbox.index = $.colorbox.group.length - 1;
					}
				} else {
					$.colorbox.index = 0;
					$.colorbox.group = $($.colorbox.element);
				}

				$body.focus();

				// Return focus on closing
				if ($.colorbox.getSetting('returnFocus')) {
					$(document).one('cbox.closed', function () {
						$($.colorbox.element).focus();
						console.log('return focus');
					});
				}
			}
			
			load();
		}
	}


	// ****************
	// PUBLIC FUNCTIONS
	// Usage format: $.colorbox.close();
	// Usage from within an iframe: parent.$.colorbox.close();
	// ****************

	$.colorbox = function (selector, options) {
		if (!selector) { return; }

		cache[selector] = options || {};

		$(document).on('click', selector, function(e){
			// ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
			// See: http://jacklmoore.com/notes/click-events/
			if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey)) {
				e.preventDefault();
				$.colorbox.selector = selector;
				launch(this);
			}
		});

		if (options && options.open && $(selector)[0]) {
			$.colorbox.selector = selector;
			launch($(selector)[0]);
		}
	};


	$.colorbox.getSetting = function (prop) {
		var setting;

		if (cache[$.colorbox.selector] && cache[$.colorbox.selector][prop] !== undefined) {
			setting = cache[$.colorbox.selector][prop];
		} else {
			setting = $.colorbox.settings[prop];
		}

		return $.isFunction(setting) ? setting.call($($.colorbox.element)) : setting;
	};


	// Default settings object.
	// See http://jacklmoore.com/colorbox for details.
	$.colorbox.settings = {
		transition: "elastic",
		speed: 300,
		width: false,
		initialWidth: "600",
		innerWidth: false,
		maxWidth: false,
		height: false,
		initialHeight: "450",
		innerHeight: false,
		maxHeight: false,
		scalePhotos: true,
		scrolling: true,
		inline: false,
		html: false,
		iframe: false,
		source: function() { return $(this).attr('href'); },
		title: function() { return $(this).attr('title'); },
		rel: function() { return $(this).attr('data-rel'); },

		// Content type
		// photo, ajax, inline, iframe, html
		type: function() {
			return $.colorbox.getSetting('photoRegex').test($.colorbox.getSetting('source')) ? 'photo' : 'ajax';
		},
		className: false,
		group: false,

		// alternate image paths for high-res displays
		retinaImage: false,
		retinaUrl: false,
		retinaSuffix: '@2x.$1',

		// internationalization
		current: "image {current} of {total}",
		previous: "previous",
		next: "next",
		close: "close",
		xhrError: "This content failed to load.",
		imgError: "This image failed to load.",

		open: false,
		returnFocus: true,
		loop: true,
		photoRegex: /\.(gif|png|jp(e|g|eg)|bmp|ico)((#|\?).*)?$/i,

		onOpen: false,
		onUnload: false,
		onLoad: false,
		onComplete: false,
		onClosed: false,

		top: false,
		bottom: false,
		left: false,
		right: false,
		fixed: false,
		data: undefined,

		structure:
		"<div class='cbox-root'>"+
			"<div class='cbox-body' role='dialog' tabindex='-1'>"+
				"<div class='cbox-content'></div>"+
				"<button class='cbox-prev'></button>"+
				"<button class='cbox-next'></button>"+
				"<div class='cbox-current'></div>"+
				"<div class='cbox-title'></div>"+
				"<button class='cbox-close'></button>"+
			"</div>"+
		"</div>"
	};

	$.colorbox.modules = {
		closeButton: function(){
			$(document).on('click.cbox', '.cbox-close', $.colorbox.close);
		},
		nextButton: function(){
			$(document).on('click.cbox', '.cbox-next', $.colorbox.next);
		},
		prevButton: function(){
			$(document).on('click.cbox', '.cbox-prev', $.colorbox.prev);
		},
		overlayClick: function(){
			$(document).on('click.cbox', '.cbox-root', function(e){
				if (e.target === this) {
					$.colorbox.close();
				}
			});
		},
		photoClick: function(){
			$(document).on('click.cbox', '.cbox-photo', $.colorbox.next);
		},
		esc: function(){
			$(document).on('keydown.cbox', function (e) {
				if (e.keyCode === 27) {
					e.preventDefault();
					$.colorbox.close();
				}
			});
		},
		leftArrow: function(){
			$(document).on('keydown.cbox', function (e) {
				if (e.keyCode === 37 && $.colorbox.group.length) {
					e.preventDefault();
					$.colorbox.prev();
				}
			});
		},
		rightArrow: function(){
			$(document).on('keydown.cbox', function (e) {
				if (e.keyCode === 39 && $.colorbox.group.length) {
					e.preventDefault();
					$.colorbox.next();
				}
			});
		},
		resize: function(){
			$(document).on('resize.cbox', function(){
				$.colorbox.position();
			});
		},
		trapFocus: function(){
			function trapFocus(e) {
				var $body = $('.cbox-body');

				if (!$.contains($body[0], e.target) && $body[0] !== e.target) {
					e.stopPropagation();
					$body.focus();
				}
			}
			
			// Confine focus to the modal
			// Uses event capturing, therefor is unsupported in IE8.
			if (document.addEventListener) {
				document.addEventListener('focus', trapFocus, true);

				$(document).one('cbox.closed', function () {
					document.removeEventListener('focus', trapFocus, true);
				});
			}
		},
		preload: function() {
			$(document).on('cbox.complete', function() {
				if (!$.colorbox.group.length) { return; }

				var next = $.colorbox.index + 1 < $.colorbox.group.length ? $.colorbox.index + 1 : 0;
				var prev = $.colorbox.index - 1 < 0 ? $.colorbox.group.length - 1 : $.colorbox.index - 1;

				$.each([next, prev], function(){
					var src,
						img,
						i = $.colorbox.group[this],
						data = $.data(i, 'colorbox');

					if (data && data.href) {
						src = data.href;
						if ($.isFunction(src)) {
							src = src.call(i);
						}
					} else {
						src = $(i).attr('href');
					}

					if (src && ($.colorbox.getSetting('photo') || $.colorbox.getSetting('photoRegex').test(src))) {
						img = new Image();
						img.src = src;
					}
				});
			});
		},
		loading: function() {
			var loadingTimer;

			$(document).on('cbox.load', function(){
				// short delay before showing loading state
				loadingTimer = setTimeout(function () {
					$(document.body).addClass('cbox_loading');
				}, 100);
			}).on('cbox.complete cbox.unload', function(){
				clearTimeout(loadingTimer);
				$(document.body).removeClass('cbox_loading');
			});
		},
		aria: function() {
			$(document).on('cbox.load', function(){
				$body.attr('aria-describedby', $($.colorbox.element).attr('aria-describedby'));
			});
		},
		photo: function() {
			$(document).on('cbox.load', function(){
				if ($.colorbox.getSetting('type') !== 'photo') { return; }

				var href = $.colorbox.getSetting('source'),
					photo = new Image();

				if ($.colorbox.getSetting('retinaUrl') && window.devicePixelRatio > 1) {
					href = href.replace($.colorbox.getSetting('photoRegex'), $.colorbox.getSetting('retinaSuffix'));
				}

				$(photo)
				.addClass('cbox-photo')
				.on('error',function () {
					prep($('<div class="cbox-error"/>').html($.colorbox.getSetting('imgError')));
				})
				.one('load', function () {

					if ($.colorbox.getSetting('retinaImage') && window.devicePixelRatio > 1) {
						photo.height = photo.height / window.devicePixelRatio;
						photo.width = photo.width / window.devicePixelRatio;
					}

					photo.style.marginTop = -photo.height/2 + 'px';
					photo.style.marginLeft = -photo.width/2 + 'px';

					// Accessibility
					photo.alt = $($.colorbox.element).attr('alt');
					photo.longdesc = $($.colorbox.element).attr('longdesc');

					prep($('<div/>').css({width:photo.width, height:photo.height}).append(photo));
				});

				photo.src = href;

			});
		},
		inline: function() {
			$(document).on('cbox.load', function(){
				if ($.colorbox.getSetting('type') !== 'inline') { return; }

				var $inline = $($.colorbox.getSetting('source'));
				// Inserts an empty placeholder where inline content is being pulled from.
				// An event is bound to put inline content back when ColorBox closes or loads new content.
				var $bookmark = $('<div/>').hide().insertBefore($inline[0]);
				$(document).on('cbox.unload', function () {
					$bookmark.replaceWith($inline);
				});

				prep($inline);
			});
		},
		iframe: function() {
			if ($.colorbox.getSetting('type') !== 'iframe') { return; }

			var iframe = $('<iframe class="cbox-iframe"/>')[0];

			$(document).on('cbox.load', function(){
				if ('frameBorder' in iframe) {
					iframe.frameBorder = 0;
				}
				
				if ('allowTransparency' in iframe) {
					iframe.allowTransparency = "true";
				}

				if (!$.colorbox.getSetting('scrolling')) {
					iframe.scrolling = "no";
				}

				$(iframe).attr({
					name: (new Date()).getTime(), // give the iframe a unique name to prevent caching
					allowFullScreen : true, // allow HTML5 video to go fullscreen
					webkitAllowFullScreen : true,
					mozallowfullscreen : true
				});

				prep(iframe);
			});

			$(document).on('cbox.complete', function(){
				iframe.src = $.colorbox.getSetting('source');
			});

			$(document).one('cbox.unload', function() {
				iframe.src = "//about:blank";
			});
		},
		ajax: function() {
			if ($.colorbox.getSetting('type') !== 'ajax') { return; }

			/* Todo: need a loading bay & requests counter */
			// $loadingBay.load(href, $.colorbox.getSetting('data'), function (data, status) {
			//	prep(status === 'error' ? $('<div class="cbox-error"/>').html($.colorbox.getSetting('xhrError')) : $(this).contents());
			// });
		},
		html: function() {
			if ($.colorbox.getSetting('type') !== 'html') { return; }

			var html = $.colorbox.getSetting('source');

			if (html) {
				prep(html);
			}
		},
		className: function() {
			var className;

			$(document).on('cbox.load', function(){
				$root.removeClass(className);
				className = $.colorbox.getSetting('className');
			});
		},
		grouping: function() {
			var current,
				$next = $('.cbox-next'),
				$prev = $('.cbox-prev'),
				$current = $('.cbox-current');

			$(document).on('cbox.complete', function(){
				var loop = $.colorbox.getSetting('loop');

				if ($.colorbox.group.length > 1) {
					$(document.body).addClass('cbox_grouped');

					current = $.colorbox.getSetting('current');

					if (typeof current === "string") {
						$current.html(current.replace('{current}', $.colorbox.index + 1).replace('{total}', $.colorbox.group.length));
					}

					$next[(loop || $.colorbox.index < $.colorbox.group.length - 1) ? "removeClass" : "addClass"]('cbox-disabled');
					$next.html($.colorbox.getSetting('next'));

					$prev[(loop || $.colorbox.index) ? "removeClass" : "addClass"]('cbox-disabled');
					$prev.html($.colorbox.getSetting('prev'));
				} else {
					$(document.body).removeClass('cbox_grouped');
				}
			});
		},
		slideshow: function() {

		}
	};


	$.colorbox.position = function (speed, loadedCallback) {
		var
		css,
		top = 0,
		left = 0;

		// keeps the top and left positions within the browser's viewport.
		if ($.colorbox.getSetting('right') !== false) {
			left += Math.max($(window).width() - size.width - interfaceWidth - setSize($.colorbox.getSetting('right'), 'x'), 0);
		} else if ($.colorbox.getSetting('left') !== false) {
			left += setSize($.colorbox.getSetting('left'), 'x');
		} else {
			left += Math.round(Math.max($(window).width() - size.width - interfaceWidth, 0) / 2);
		}
		
		if ($.colorbox.getSetting('bottom') !== false) {
			top += Math.max($(window).height() - size.height - interfaceHeight - setSize($.colorbox.getSetting('bottom'), 'y'), 0);
		} else if ($.colorbox.getSetting('top') !== false) {
			top += setSize($.colorbox.getSetting('top'), 'y');
		} else {
			top += Math.round(Math.max($(window).height() - size.height - interfaceHeight, 0) / 2);
		}

		// setting the speed to 0 to reduce the delay between same-sized content.
		speed = ($body.width() === size.width && $body.height() === size.height) ? 0 : speed || 0;

		css = {width: size.width + interfaceWidth, height: size.height + interfaceHeight, top: top, left: left};

		$body.dequeue().animate(css, {
			duration: speed,
			complete: function () {
				active = false;

				if (loadedCallback) {
					loadedCallback();
				}
			}
		});
	};

	function prep (object) {
		if (!open) {
			return;
		}

		var callback, speed = $.colorbox.getSetting('transition') === "none" ? 0 : $.colorbox.getSetting('speed');
		
		size = {
			minWidth: 0,
			minHeight: 0,
			width: false,
			height: false,
			maxWidth: false,
			maxHeight: false
		};

		if ($.colorbox.getSetting('minWidth')) {
			size.minWidth = setSize($.colorbox.getSetting('minWidth'), 'x') - interfaceWidth;
		}

		if ($.colorbox.getSetting('minHeight')) {
			size.minHeight = setSize($.colorbox.getSetting('minHeight'), 'y') - interfaceHeight;
		}

		size.maxHeight = size.height = $.colorbox.getSetting('height') ?
				setSize($.colorbox.getSetting('height'), 'y') - interfaceHeight :
				$.colorbox.getSetting('innerHeight') && setSize($.colorbox.getSetting('innerHeight'), 'y');
		
		size.maxWidth = size.width = $.colorbox.getSetting('width') ?
				setSize($.colorbox.getSetting('width'), 'x') - interfaceWidth :
				$.colorbox.getSetting('innerWidth') && setSize($.colorbox.getSetting('innerWidth'), 'x');
		
		// Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
		// If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
		if ($.colorbox.getSetting('maxWidth')) {
			size.maxWidth = setSize($.colorbox.getSetting('maxWidth'), 'x') - interfaceWidth;
			size.maxWidth = size.width && size.width < size.maxWidth ? size.width : size.maxWidth;
		}

		if ($.colorbox.getSetting('maxHeight')) {
			size.maxHeight = setSize($.colorbox.getSetting('maxHeight'), 'y') - interfaceHeight;
			size.maxHeight = size.height && size.height < size.maxHeight ? size.height : size.maxHeight;
		}

		function getWidth() {
			size.width = size.width || $content.width();
			size.width = size.maxWidth && size.maxWidth < size.width ? size.maxWidth : size.width;
			return size.width;
		}
		function getHeight() {
			size.height = size.height || $content.height();
			size.height = size.maxHeight && size.maxHeight < size.height ? size.maxHeight : size.height;
			return size.height;
		}

		$content
			//.appendTo($loadingBay.show())// content has to be appended to the DOM for accurate size calculations.
			.empty()
			.css({width:'', height:'', visibility:'hidden', display:'inline-block'})
			.appendTo(document.body)
			.append(object)
			.css({width: getWidth(), overflow: $.colorbox.getSetting('scrolling') ? 'auto' : 'hidden'})
			.css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
			.css({visibility:''})
			.prependTo($body);
			
		$content.css({width: '100%', height: '100%'});

		//$('.cbox-photo').parent().css({width:'', height:''});

		callback = function () {
			if (!open) {
				return;
			}
			
			$('.cbox-title').html($.colorbox.getSetting('title'));

			$content.show();
			
			$(document).trigger('cbox.complete');
			$.colorbox.getSetting('onComplete');
		};

		$.colorbox.position(speed, callback);
	}

	function load () {
		active = true;

		$(document).trigger('cbox.unload');
		
		$.each($.colorbox.modules, function(){
			if ($.isFunction(this)) {
				this();
			}
		});

		$(document).on('cbox.unload', function(){
			$(document).off('.cbox');
			$(document).off('cbox');
		});

		$(document).trigger('cbox.load');
		$.colorbox.getSetting('onLoad');
	}

	// Navigates to the next page/image in a set.
	$.colorbox.next = function () {
		if (!active && $.colorbox.group.length && ($.colorbox.getSetting('loop') || $.colorbox.group[$.colorbox.index + 1])) {
			$.colorbox.index = $.colorbox.index + 1 < $.colorbox.group.length ? $.colorbox.index + 1 : 0;
			launch($.colorbox.group[$.colorbox.index]);
		}
	};
	
	$.colorbox.prev = function () {
		if (!active && $.colorbox.group.length && ($.colorbox.getSetting('loop') || $.colorbox.index)) {
			$.colorbox.index = $.colorbox.index - 1 < 0 ? $.colorbox.group.length - 1 : $.colorbox.index - 1;
			launch($.colorbox.group[$.colorbox.index]);
		}
	};

	// Note: to use this within an iframe use the following format: parent.$.colorbox.close();
	$.colorbox.close = function () {
		if (open && !closing) {
			
			closing = true;
			
			open = false;
	
			$root.stop().fadeTo(300, 0, function () {
			
				$(document).trigger('cbox.unload');

				$.colorbox.getSetting('onUnload');

				$root.remove();

				$(document.body).removeClass('cbox_open');
				
				closing = false;

				$(document).trigger('cbox.closed');

				$.colorbox.getSetting('onClosed');
			});
		}
	};

	// Removes changes ColorBox made to the document, but does not remove the plugin
	// from jQuery.
	$.colorbox.remove = function () {

	};
	
	$.colorbox.index = null;

	$.colorbox.group = null;

	$.colorbox.element = null;

	$.colorbox.selector = null;

}(jQuery, document, window));
