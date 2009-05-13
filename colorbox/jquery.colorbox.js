/*
	ColorBox v1.2.0 - a full featured, light-weight, customizable lightbox based on jQuery 1.3
	(c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
	Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/


//JSLint does not approve of using document.write(), but it is the only method
//I am aware of for adding a style element that Safari 3.0 supports.
document.write("\r\n<style type='text/css'>\r\n"+
'#colorbox, #cboxOverlay, #cboxWrapper{position:absolute; top:0; left:0; z-index:9999; overflow:hidden;}\r\n'+
'#cboxOverlay{position:fixed; width:100%; height:100%;}\r\n'+
'#cboxMiddleLeft, #cboxBottomLeft{clear:left;}\r\n'+
'#cboxContent{position:relative; overflow:visible;}\r\n'+
'#cboxLoadedContent{overflow:auto; width:0; height:0;}\r\n'+
'#cboxLoadedContent iframe{display:block; width:100%; height:100%; border:0;}\r\n'+
'#cboxTitle{margin:0;}\r\n'+
'#cboxLoadingOverlay, #cboxLoadingGraphic{position:absolute; top:0; left:0; width:100%;}\r\n'+
'#cboxPrevious, #cboxNext, #cboxClose, #cboxSlideshow{cursor:pointer;}\r\n'+
'<\/style>\r\n');

(function($){
	
	var settings, callback, loadedWidth, loadedHeight, interfaceHeight, interfaceWidth, index, related, ssTimeout, $slideshow, $window, $close, $next, $prev, $current, $title, $modal, $wrap, $loadingOverlay, $loadingGraphic, $overlay, $modalContent, $loaded, $borderTopCenter, $borderMiddleLeft, $borderMiddleRight, $borderBottomCenter;
	
	/* Helper Functions */
	//function for IE6 to set the background overlay
	function IE6Overlay(){
		$overlay.css({"position":"absolute", width:$window.width(), height:$window.height(), top:$window.scrollTop(), left:$window.scrollLeft()});
	}

	function keypressEvents(e){
		if(e.keyCode == 37){
			e.preventDefault();
			$prev.click();
		} else if(e.keyCode == 39){
			e.preventDefault();
			$next.click();
		}
	}

	function slideshow(){
		var stop;
		function start(){
			$slideshow
			.text(settings.slideshowStop)
			.bind("cbox_complete", function(){
				$slideshow.show();
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
		
		if(settings.slideshow!==false && related.length>1){
			if(settings.slideshowAuto===true){
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

	// Convert % values to pixels
	function setSize(size, dimension){
		return (typeof size == 'string') ? (size.match(/%/) ? (dimension/100)*parseInt(size, 10) : parseInt(size, 10)) : size;
	}

	function isImage(url){
		return url.match(/\.(gif|png|jpg|jpeg|bmp)(?:\?([^#]*))?(?:#(.*))?$/i);
	}

	/* Initializes ColorBox when the DOM has loaded */
	$(function(){
		$.fn.colorbox.init();
	});

	$.fn.colorbox = function(options, custom_callback) {
		$(this).unbind("click.colorbox").bind("click.colorbox", function (event) {
				
			//remove the focus from the anchor to prevent accidentally calling
			//colorbox multiple times, which is allowed but probably not desired.
			this.blur();	
			
			settings = $.extend({}, $.fn.colorbox.settings, options);
			
			if(custom_callback){
				callback = custom_callback;
			} else {
				callback = function(){};
			}
			
			if(settings.width){ settings.width = setSize(settings.width, document.documentElement.clientWidth);}
			if(settings.height){ settings.height = setSize(settings.height, document.documentElement.clientHeight);}
			
			if (this.rel && 'nofollow' != this.rel) {
				related = $("a[rel='" + this.rel + "']");
				index = $(related).index(this);
			} else {
				related = $(this);
				index = 0;
			}
			if ($modal.data("open") !== true) {
				$.event.trigger('cbox_open');
				$close.html(settings.close);
				$overlay.css({"opacity": settings.opacity}).show();
				$modal.data("open", true);
				$.fn.colorbox.position(setSize(settings.initialWidth, document.documentElement.clientWidth), setSize(settings.initialHeight, document.documentElement.clientHeight), 0);
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
		
		if(options && options.open && $modal.data("open")!==true){
			$(this).triggerHandler('click.colorbox');
		}
		
		return this.each(function(){});
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
			$loaded = $('<div id="cboxLoadedContent" />'),
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
		index = index < related.length-1 ? index+1 : 0;
		$.fn.colorbox.load();
	};
	
	$.fn.colorbox.prev = function(){
		index = index > 0 ? index-1 : related.length-1;
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
		if($modal.data("open")!==true){ return false; }
		
		var speed = settings.transition=="none" ? 0 : settings.speed;
		$loaded.remove();
		$loaded = $(object);
		
		$loaded.hide()
		.appendTo('body')
		.css({width:(settings.width)?settings.width - loadedWidth - interfaceWidth:$loaded.width()})
		.css({height:(settings.height)?settings.height - loadedHeight - interfaceHeight:$loaded.height()})//sets the height independently from the width in case the new width influences the value of height.
		.attr({id:'cboxLoadedContent'})
		.prependTo($modalContent);
		
		if ($.browser.msie && $.browser.version < 7) {
			$('select').not($('#colorbox select')).css({'visibility':'hidden'});
		}
		
		if($('#cboxPhoto').length > 0 && settings.height){
			var topMargin = (parseInt($loaded[0].style.height, 10) - parseInt($('#cboxPhoto')[0].style.height, 10))/2;
			$('#cboxPhoto').css({marginTop:(topMargin > 0?topMargin:0)});
		}
		$().unbind('keydown.cbox_key');
		function setPosition(s){
			var mWidth = parseInt($loaded[0].style.width, 10)+loadedWidth+interfaceWidth;
			var mHeight = parseInt($loaded[0].style.height, 10)+loadedHeight+interfaceHeight;
			$.fn.colorbox.position(mWidth, mHeight, s, function(){
				if($modal.data("open")!==true){
					return false;
				}
				
				$modalContent.children().show();
				$loadingOverlay.hide();
				$loadingGraphic.hide();
				$slideshow.hide();
				
				$title.html(settings.title ? settings.title : related[index].title);
				if(related.length>1){
					$current.html(settings.current.replace(/\{current\}/, index+1).replace(/\{total\}/, related.length));
					$next.html(settings.next);
					$prev.html(settings.previous);
					$().bind('keydown.cbox_key', keypressEvents);
				} else {
					$current.add($next).add($prev).hide();
				}
				
				$('#cboxIframe').attr('src', $('#cboxIframe').attr('src'));//reloads the iframe now that it is added to the DOM & it is visible, which increases compatability with pages using DOM dependent JavaScript.
				
				$.event.trigger('cbox_complete');
				callback();
				if (settings.transition === 'fade'){
					$modal.fadeTo(speed, 1);
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
		
		if(settings.preloading !== false && related.length>1 && isImage(related[index].href)){
			var previous, next;
			previous = index > 0 ? related[index-1].href : related[related.length-1].href;
			next = index < related.length-1 ? related[index+1].href : related[0].href;
			return [$('<img />').attr('src', next), $('<img />').attr('src', previous)];
		}
		
		return true;
	};
	
	$.fn.colorbox.load = function(){
		$.event.trigger('cbox_load');
		$loadingOverlay.show();
		$loadingGraphic.show();
		$close.show();

		clearInline();//puts inline elements back if they are being used
		
		var href = settings.href ? settings.href : related[index].href;
		
		if (settings.inline) {
			$('<div id="cboxInlineTemp" />').hide().insertBefore($(href)[0]);
			$.fn.colorbox.dimensions($(href).wrapAll("<div />").parent());
		} else if (settings.iframe) {
			$.fn.colorbox.dimensions(
				$("<div><iframe id='cboxIframe' name='iframe_"+new Date().getTime()+"' frameborder=0 src='"+href+"' /></div>")
			);//timestamp to prevent caching.
		} else if (isImage(href)){
			var loadingElement = new Image();
			loadingElement.onload = function(){
				loadingElement.onload = null;
				$.fn.colorbox.dimensions($("<div />").css({width:this.width, height:this.height}).append($(this).css({width:this.width, height:this.height, display:"block", margin:"auto"}).attr('id', 'cboxPhoto')));
				if(related.length > 1){
					$(this).css({cursor:'pointer'}).click($.fn.colorbox.next);
				}
			};
			loadingElement.src = href;
		}else {
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
		$slideshow.unbind('cbox_complete cbox_load');
		clearInline();
		$overlay.css({cursor:'auto'}).fadeOut('fast').unbind('click', $.fn.colorbox.close);
		$().unbind('keydown.cbox_key');
		
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
	*/
	$.fn.colorbox.settings = {
		transition : "elastic", // Transition types: "elastic", "fade", or "none".
		speed : 350, // Sets the speed of the fade and elastic transitions, in milliseconds.
		initialWidth : "400", // Set the initial width of the modal, prior to any content being loaded.
		initialHeight : "400", // Set the initial height of the modal, prior to any content being loaded.
		width : false, // Set a fixed width for div#loaded.  Example: "500px"
		height : false, // Set a fixed height for div#modalLoadedContent.  Example: "500px"
		inline : false, // Set this to the selector of inline content to be displayed.  Example "#myHiddenDiv" or "body p".
		iframe : false, // If 'true' specifies that content should be displayed in an iFrame.
		href : false, // This can be used as an alternate anchor URL for ColorBox to use, or can be used to assign a URL for non-anchor elments such as images or form buttons.
		title : false, // This can be used as an alternate anchor title.
		opacity : 0.9, // The modalBackgroundOverlay opacity level. Range: 0 to 1.
		preloading : true, // Allows for preloading of 'Next' and 'Previous' content in a shared relation group (same values for the 'rel' attribute), after the current content has finished loading.  Set to 'false' to disable.
		current : "image {current} of {total}", // the format of the contentCurrent information
		previous : "previous", // the anchor text for the previous link in a shared relation group (same values for 'rel').
		next : "next", // the anchor text for the next link in a shared relation group (same 'rel' attribute').
		close : "close", // the anchor text for the close link.  Esc will also close the modal.
		open : false, //Automatically opens ColorBox. (fires the click.colorbox event without waiting for user input).
		overlayClose : true,  //If true, enables closing ColorBox by clicking on the background overlay.
		slideshow:false,
		slideshowAuto:true,
		slideshowSpeed: 2500,
		slideshowStart: "start slideshow",
		slideshowStop: "stop slideshow"
	};
})(jQuery);

