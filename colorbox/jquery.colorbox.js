/*
	ColorBox v1.2.3 - a full featured, light-weight, customizable lightbox based on jQuery 1.3
	(c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
	Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
(function($){
	
	var element, settings, callback, maxWidth, maxHeight, loadedWidth, loadedHeight, interfaceHeight, interfaceWidth, index, $related, ssTimeout, $slideshow, $window, $close, $next, $prev, $current, $title, $modal, $wrap, $loadingOverlay, $loadingGraphic, $overlay, $modalContent, $loaded, $borderTopCenter, $borderMiddleLeft, $borderMiddleRight, $borderBottomCenter;
	
	/* Helper Functions */
	//function for IE6 to set the background overlay
	function IE6Overlay(){
		$overlay.css({"position":"absolute", width:$window.width(), height:$window.height(), top:$window.scrollTop(), left:$window.scrollLeft()});
	}

	function slideshow(){
		var stop;
		function start(){
			$slideshow
			.text(settings.slideshowStop)
			.bind("cbox_complete", function(){
				ssTimeout = setTimeout($.fn.colorbox.next, settings.slideshowSpeed);
			})
			.bind("cbox_load", function(){
				clearTimeout(ssTimeout);	
			}).one("click", function(){
				stop();
				$(this).removeClass('hover');
			});
			$modal.removeClass("cboxSlideshow_off").addClass("cboxSlideshow_on");
		}
		
		stop = function(){
			clearTimeout(ssTimeout);
			$slideshow
			.text(settings.slideshowStart)
			.unbind('cbox_complete cbox_load')
			.one("click", function(){
				start();
				ssTimeout = setTimeout($.fn.colorbox.next, settings.slideshowSpeed);
				$(this).removeClass('hover');
			});
			$modal.removeClass("cboxSlideshow_on").addClass("cboxSlideshow_off");
		};
		
		if(settings.slideshow && $related.length>1){
			if(settings.slideshowAuto){
				start();
			} else {
				stop();
			}
		}
	}

	function clearInline(){
		if($("#cboxInlineTemp").length > 0){
			$loaded.children().insertAfter("#cboxInlineTemp");
		}
	}

	function cbox_key(e) {
		if(e.keyCode == 37){
			e.preventDefault();
			$prev.click();
		} else if(e.keyCode == 39){
			e.preventDefault();
			$next.click();
		}
	}

	// Convert % values to pixels
	function setSize(size, dimension){
		dimension = dimension=='x' ? document.documentElement.clientWidth : document.documentElement.clientHeight;
		return (typeof size == 'string') ? (size.match(/%/) ? (dimension/100)*parseInt(size, 10) : parseInt(size, 10)) : size;
	}

	function isImage(url){
		return settings.photo ? true : url.match(/\.(gif|png|jpg|jpeg|bmp)(?:\?([^#]*))?(?:#(.*))?$/i);
	}

	/* Initializes ColorBox when the DOM has loaded */
	$(function(){
		$.fn.colorbox.init();
	});

	$.fn.colorbox = function(options, custom_callback) {
		
		if(this.length){
			this.each(function(){
				if($(this).data("colorbox")){
					$(this).data("colorbox", $.extend({}, $(this).data("colorbox"), options));
				} else {
					$(this).data("colorbox", $.extend({}, $.fn.colorbox.settings, options));
				}
				
				var data = $(this).data("colorbox");
				data.title = data.title ? data.title : this.title;
				data.href = data.href ? data.href : this.href;
				data.rel = data.rel ? data.rel : this.rel;
				$(this).data("colorbox", data).addClass("cboxelement");
			});
		} else {
			$(this).data("colorbox", $.extend({}, $.fn.colorbox.settings, options));
		}
		
		$(this).unbind("click.colorbox").bind("click.colorbox", function (event) {
			
			element = this;
			
			settings = $(this).data('colorbox');
			
			//remove the focus from the anchor to prevent accidentally calling
			//colorbox multiple times (by pressing the 'Enter' key
			//after colorbox has opened, but before the user has clicked on anything else)
			this.blur();
			
			callback = custom_callback ? custom_callback : false;
			
			if (settings.rel && settings.rel != 'nofollow') {
				$related = $('.cboxelement').filter(function(){
					return ($(this).data("colorbox").rel == settings.rel);
				});
				index = $related.index(this);
			} else {
				$related = $(this);
				index = 0;
			}
			if (!$modal.data("open")) {
				$.event.trigger('cbox_open');
				$close.html(settings.close);
				$overlay.css({"opacity": settings.opacity}).show();
				$modal.data("open", true);
				$.fn.colorbox.position(setSize(settings.initialWidth, 'x'), setSize(settings.initialHeight, 'y'), 0);
				if ($.browser.msie && $.browser.version < 7) {
					$window.bind("resize scroll", IE6Overlay);
				}
			}
			slideshow();
			$.fn.colorbox.load();
			
			if(settings.overlayClose===true){
				$overlay.css({"cursor":"pointer"}).click($.fn.colorbox.close);
			}
			event.preventDefault();
		});
		
		if(options && options.open){
			$(this).triggerHandler('click.colorbox');
		}
		
		return this;
	};

	$.fn.colorbox.element = function(){
		return element;
	};

	/*
	  Initialize the modal: store common calculations, preload the interface graphics, append the html.
	  This preps colorbox for a speedy open when clicked, and lightens the burdon on the browser by only
	  having to run once, instead of each time colorbox is opened.
	*/
	$.fn.colorbox.init = function(){
		
		$window = $(window);
		
		$('body').prepend(
			$overlay = $('<div id="cboxOverlay" />').hide(), 
			$modal = $('<div id="colorbox" />')
		);
		
		$wrap = $('<div id="cboxWrapper" />').appendTo($modal).append(
			$('<div/>').append(
				$('<div id="cboxTopLeft"/>'),
				$borderTopCenter = $('<div id="cboxTopCenter"/>'),
				$('<div id="cboxTopRight"/>')
			),
			$borderMiddleLeft = $('<div id="cboxMiddleLeft" />'),
			$modalContent = $('<div id="cboxContent" />'),
			$borderMiddleRight = $('<div id="cboxMiddleRight" />'),
			$('<div/>').append(
				$('<div id="cboxBottomLeft"/>'),
				$borderBottomCenter = $('<div id="cboxBottomCenter"/>'),
				$('<div id="cboxBottomRight"/>')
			)
		);
		
		$wrap.find("[id]").css({'float':'left'});
		
		$modalContent.append(
			//loaded is filled with temporary HTML to allow the CSS backgrounds for those elements to load before ColorBox is actually called.
			$loaded = $('<div id="cboxLoadedContent" style="width:0; height:0;" />'),
			$loadingOverlay = $('<div id="cboxLoadingOverlay" />'),
			$loadingGraphic = $('<div id="cboxLoadingGraphic" />'),
			$title = $('<div id="cboxTitle" />'),
			$current = $('<div id="cboxCurrent" />'),
			$slideshow = $('<div id="cboxSlideshow" />'),
			$next = $('<div id="cboxNext" />').click($.fn.colorbox.next),
			$prev = $('<div id="cboxPrevious" />').click($.fn.colorbox.prev),
			$close = $('<div id="cboxClose" />').click($.fn.colorbox.close)
		);
		
		$modalContent.children()
			.addClass("hover")
			.mouseover(function(){$(this).addClass("hover");})
			.mouseout(function(){$(this).removeClass("hover");})
			.hide();
		
		//precalculate sizes that will be needed multiple times.
		interfaceHeight = $borderTopCenter.height()+$borderBottomCenter.height()+$modalContent.outerHeight(true) - $modalContent.height();//Subtraction needed for IE6
		interfaceWidth = $borderMiddleLeft.width()+$borderMiddleRight.width()+$modalContent.outerWidth(true) - $modalContent.width();
		loadedHeight = $loaded.outerHeight(true);
		loadedWidth = $loaded.outerWidth(true);
		
		$modal.css({"padding-bottom":interfaceHeight,"padding-right":interfaceWidth}).hide();//the padding removes the need to do size conversions during the animation step.
		
		//Setup button & key events.
		$().bind("keydown.cbox_close", function(e){
			if (e.keyCode == 27) {
				e.preventDefault();
				$close.click();
			}
		});
		
		$modalContent.children().removeClass("hover");
	};
	
	//navigates to the next page/image in a set.
	$.fn.colorbox.next = function(){
		index = index < $related.length-1 ? index+1 : 0;
		$.fn.colorbox.load();
	};
	
	$.fn.colorbox.prev = function(){
		index = index > 0 ? index-1 : $related.length-1;
		$.fn.colorbox.load();
	};
	
	$.fn.colorbox.position = function(mWidth, mHeight, speed, loadedCallback){
		var winHeight = document.documentElement.clientHeight;
		var posTop = winHeight/2 - mHeight/2;
		var posLeft = document.documentElement.clientWidth/2 - mWidth/2;
		//keeps the box from expanding to an inaccessible area offscreen.
		if(mHeight > winHeight){posTop -=(mHeight - winHeight);}
		if(posTop < 0){posTop = 0;} 
		if(posLeft < 0){posLeft = 0;}
		
		posTop+=$window.scrollTop();
		posLeft+=$window.scrollLeft();
		
		mWidth = mWidth - interfaceWidth;
		mHeight = mHeight - interfaceHeight;
		
		//this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
		//but it has to be shrank down around the size of div#colorbox when it's done.  If not,
		//it can invoke an obscure IE bug when using iframes.
		$wrap[0].style.width = $wrap[0].style.height = "9999px";

		function modalDimensions(that){
			//loading overlay size has to be sure that IE6 uses the correct height.
			$borderTopCenter[0].style.width = $borderBottomCenter[0].style.width = $modalContent[0].style.width = that.style.width;
			$loadingGraphic[0].style.height = $loadingOverlay[0].style.height = $modalContent[0].style.height = $borderMiddleLeft[0].style.height = $borderMiddleRight[0].style.height = that.style.height;
		}
		
		//setting the speed to 0 to reduce the delay between same-sized content.
		var animate_speed = ($modal.width()===mWidth && $modal.height() === mHeight) ? 0 : speed;
		$modal.dequeue().animate({height:mHeight, width:mWidth, top:posTop, left:posLeft}, {duration: animate_speed,
			complete: function(){
				modalDimensions(this);
				
				//shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.
				$wrap[0].style.width = (mWidth+interfaceWidth) + "px";
				$wrap[0].style.height = (mHeight+interfaceHeight) + "px";
				
				if (loadedCallback) {loadedCallback();}
				if ($.browser.msie && $.browser.version < 7) {IE6Overlay();}
			},
			step: function(){
				modalDimensions(this);
			}
		});
	};
	
	$.fn.colorbox.dimensions = function(object){
		$window.unbind('resize.cbox_resize');
		if(!$modal.data("open")){ return false; }
		
		var speed = settings.transition=="none" ? 0 : settings.speed;
		$loaded.remove();
		$loaded = $(object);
		
		function getWidth(){
			if(settings.width){
				return maxWidth;
			} else {
				return maxWidth && maxWidth < $loaded.width() ? maxWidth : $loaded.width();
			}
		}
		function getHeight(){
			if(settings.height){
				return maxHeight;
			} else {
				return maxHeight && maxHeight < $loaded.height() ? maxHeight : $loaded.height();
			}
		}
		
		$loaded.hide().appendTo('body')
		.attr({id:'cboxLoadedContent'})
		.css({width:getWidth()})
		.css({height:getHeight()})//sets the height independently from the width in case the new width influences the value of height.
		.prependTo($modalContent);
		
		if ($.browser.msie && $.browser.version < 7) {
			$('select').not($('#colorbox select')).css({'visibility':'hidden'});
		}
				
		if($('#cboxPhoto').length > 0 && settings.height){
			var topMargin = ($loaded.height() - parseInt($('#cboxPhoto')[0].style.height, 10))/2;
			$('#cboxPhoto').css({marginTop:(topMargin > 0?topMargin:0)});
		}
		
		function setPosition(s){
			var mWidth = $loaded.width()+loadedWidth+interfaceWidth;
			var mHeight = $loaded.height()+loadedHeight+interfaceHeight;
			$.fn.colorbox.position(mWidth, mHeight, s, function(){
				if(!$modal.data("open")){
					return false;
				}
				
				if($.browser.msie){
					//This fadeIn helps the bicubic resampling to kick-in.
					if($('#cboxPhoto').length > 0 ){$loaded.fadeIn(100);}
					//IE adds a filter when ColorBox fades in and out that can cause problems if the loaded content contains transparent pngs.
					$modal.css('filter','');
				}
				
				$modalContent.children().show();
				
				$loadingOverlay.hide();
				$loadingGraphic.hide();
				$slideshow.hide();
				
				if($related.length>1){
					$current.html(settings.current.replace(/\{current\}/, index+1).replace(/\{total\}/, $related.length));
					$next.html(settings.next);
					$prev.html(settings.previous);
					
					$().unbind('keydown', cbox_key).one('keydown', cbox_key);
					
					if(settings.slideshow){
						$slideshow.show();
					}
				} else {
					$current.add($next).add($prev).hide();
				}
				$title.html(settings.title);
				
				$('#cboxIframe').attr('src', $('#cboxIframe').attr('src'));//reloads the iframe now that it is added to the DOM & it is visible, which increases compatability with pages using DOM dependent JavaScript.
				
				$.event.trigger('cbox_complete');
				
				if(callback){
					$(element).each(callback);
				}
				
				if (settings.transition === 'fade'){
					$modal.fadeTo(speed, 1, function(){
						if($.browser.msie){$modal.css('filter','');}
					});
				}
				
				$window.bind('resize.cbox_resize', function(){
					$.fn.colorbox.position(mWidth, mHeight, 0);
				});
				
				return true;
			});
		}
		if (settings.transition == 'fade') {
			$modal.fadeTo(speed, 0, function(){setPosition(0);});
		} else {
			setPosition(speed);
		}
		
		if(settings.preloading && $related.length>1){
			var previous = index > 0 ? $related[index-1] : $related[$related.length-1];
			var next = index < $related.length-1 ? $related[index+1] : $related[0];
			if(isImage($(next).data('colorbox').href)){
				$('<img />').attr('src', next);
			}
			if(isImage($(previous).data('colorbox').href)){
				$('<img />').attr('src', previous);
			}
		}
		
		return true;
	};
	
	$.fn.colorbox.load = function(){
		
		$.event.trigger('cbox_load');
		
		element = $related[index];
		
		settings = $(element).data('colorbox');
		
		$loadingOverlay.show();
		$loadingGraphic.show();
		$close.show();
		clearInline();//puts inline elements back if they are being used
		
		// Evaluate the height based on the optional height and width settings.
		var height = settings.height ? setSize(settings.height, 'y') - loadedHeight - interfaceHeight : false;
		var width = settings.width ? setSize(settings.width, 'x') - loadedWidth - interfaceWidth : false;
		
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
		
		var href = settings.href;
		
		if (settings.inline) {
			$('<div id="cboxInlineTemp" />').hide().insertBefore($(href)[0]);
			$.fn.colorbox.dimensions($(href).wrapAll('<div/>').parent());
		} else if (settings.iframe) {
			$.fn.colorbox.dimensions(
				$("<div><iframe id='cboxIframe' name='iframe_"+new Date().getTime()+"' frameborder=0 src='"+href+"' /></div>")
			);//timestamp to prevent caching.
		} else if (isImage(href)){
			var loadingElement = new Image();
			loadingElement.onload = function(){
				loadingElement.onload = null;
			
				if((maxHeight || maxWidth) && settings.resize){
					var width = this.width;
					var height = this.height;
					var percent = 0;
					var that = this;
					
					var setResize = function(){
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
				
				$.fn.colorbox.dimensions($("<div />").css({width:this.width, height:this.height}).append($(this).css({width:this.width, height:this.height, display:"block", margin:"auto", border:0}).attr('id', 'cboxPhoto')));
				if($related.length > 1){
					$(this).css({cursor:'pointer'}).click($.fn.colorbox.next);
				}
				if($.browser.msie && $.browser.version == 7){
					this.style.msInterpolationMode='bicubic';
				}
			};
			loadingElement.src = href;
		} else {
			$('<div />').load(href, function(data, textStatus){
				if(textStatus == "success"){
					$.fn.colorbox.dimensions($(this));
				} else {
					$.fn.colorbox.dimensions($("<p>Request unsuccessful.</p>"));
				}
			});
		}	
	};

	//public function for closing colorbox.  To use this within an iframe use the following format: parent.$.fn.colorbox.close();
	$.fn.colorbox.close = function(){
		clearTimeout(ssTimeout);
		$window.unbind('resize.cbox_resize');
		$slideshow.unbind('cbox_complete cbox_load click');
		clearInline();
		$overlay.css({cursor:'auto'}).fadeOut('fast').unbind('click', $.fn.colorbox.close);
		$().unbind('keydown', cbox_key);
		
		if ($.browser.msie && $.browser.version < 7) {
			$('select').css({'visibility':'inherit'});
			$window.unbind('resize scroll', IE6Overlay);
		}
		
		$modalContent.children().hide();
		
		$modal
		.stop(true, false)
		.removeClass()
		.fadeOut('fast', function(){
			$loaded.remove();
			$modal.removeData('open').css({'opacity':1});
			$.event.trigger('cbox_closed');
		});
	};

	/*
		ColorBox Default Settings.
		
		The colorbox() function takes one argument, an object of key/value pairs, that are used to initialize the modal.
		
		Please do not change these settings here, instead overwrite these settings when attaching the colorbox() event to your anchors.
		Example (Global)	: $.fn.colorbox.settings.transition = "fade"; //changes the transition to fade for all colorBox() events proceeding it's declaration.
		Example (Specific)	: $("a[href='http://www.google.com']").colorbox({width:"90%", height:"450px", iframe:true});
		
		See http://colorpowered.com/colorbox for details.
	*/
	$.fn.colorbox.settings = {
		transition : "elastic",
		speed : 350,
		width : false,
		height : false,
		initialWidth : "400",
		initialHeight : "400",
		maxWidth : false,
		maxHeight : false,
		resize : true,
		inline : false,
		iframe : false,
		photo : false,
		href : false,
		title : false,
		rel : false,
		opacity : 0.9,
		preloading : true,
		current : "image {current} of {total}",
		previous : "previous",
		next : "next",
		close : "close",
		open : false,
		overlayClose : true,
		slideshow:false,
		slideshowAuto:true,
		slideshowSpeed: 2500,
		slideshowStart: "start slideshow",
		slideshowStop: "stop slideshow"
	};
})(jQuery);

