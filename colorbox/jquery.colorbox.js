/*
	ColorBox v1.1.6 - a full featured, light-weight, customizable lightbox based on jQuery 1.3
	(c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
	Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

(function($){
var settings, loadedWidth, loadedHeight, interfaceHeight, interfaceWidth, index, related, loadingElement, $modal, modalWrap, $loadingOverlay, $overlay, $modalContent, $loaded, $close, $borderTopCenter, $borderMiddleLeft, $borderMiddleRight, $borderBottomCenter;
function setModalOverlay(){
	$overlay.css({"position":"absolute", width:$(window).width(), height:$(window).height(), top:$(window).scrollTop(), left:$(window).scrollLeft()});
}
function keypressEvents(e){
	if(e.keyCode == 37){
		e.preventDefault();
		$(document).unbind('keydown', keypressEvents);
		$("a#contentPrevious").click();
	} else if(e.keyCode == 39){
		e.preventDefault();
		$(document).unbind('keydown', keypressEvents);
		$("a#contentNext").click();
	}
}
function clearLoading(){
	if($("#colorboxInlineTemp").length > 0){
		$loaded.children().insertAfter("#colorboxInlineTemp");
	}
	if(loadingElement){$(loadingElement).remove();}
}

// Convert % values to pixels
function setSize(size, dimension){
	return (typeof size == 'string') ? (size.match(/%/) ? (dimension/100)*parseInt(size, 10) : parseInt(size, 10)) : size;
}

/*
  Initialize the modal: store common calculations, preload the interface graphics, append the html.
  This preps colorbox for a speedy open when clicked, and lightens the burdon on the browser by only
  having to run once, instead of each time colorbox is opened.
*/
$(function(){//jQuery shortcut for $(document).ready(function(){});
	$("body").append(
		$overlay = $('<div id="modalBackgroundOverlay" />').hide(), 
		$modal = $('<div id="colorbox" />').css("opacity", 0)
	);

	$('<div id="modalWrap" />').appendTo($modal).append(
		$('<div><div id="borderTopLeft" /><div id="borderTopCenter" /><div id="borderTopRight" /></div>'),
		$borderMiddleLeft = $('<div id="borderMiddleLeft" />'),
		$modalContent = $('<div id="modalContent" />'),
		$borderMiddleRight = $('<div id="borderMiddleRight" />'),
		$('<div><div id="borderBottomLeft" /><div id="borderBottomCenter" /><div id="borderBottomRight" /></div>')
	);
	$modalContent.append(
		//loaded is filled with temporary HTML to allow the CSS backgrounds for those elements to load before ColorBox is actually called.
		$loaded = $('<div id="modalLoadedContent"><a id="contentNext" href="#"></a><a id="contentPrevious" href="#"></a><span id="contentCurrent"></span><span id="contentTitle"></span><div id="preloadPrevious"></div><div id="preloadNext"></div><div id="preloadClose"></div></div>'), 
		$loadingOverlay = $('<div id="modalLoadingOverlay" />'),
		$close = $('<a id="modalClose" href="#"></a>')
	);

	$(document).bind("keydown.colorClose", function(e){
		if (e.keyCode == 27) {
			e.preventDefault();
			$.fn.colorbox.close();
		}
	});

	$close.click(function(event){
		event.preventDefault();
		$.fn.colorbox.close();
	});

	$borderTopCenter = $("#borderTopCenter");
	$borderBottomCenter = $("#borderBottomCenter");

	interfaceHeight = $borderTopCenter.height()+$borderBottomCenter.height()+$modalContent.outerHeight(true) - $modalContent.height();//Subtraction needed for IE6
	interfaceWidth = $borderMiddleLeft.width()+$borderMiddleRight.width()+$modalContent.outerWidth(true) - $modalContent.width();

	loadedHeight = $loaded.outerHeight(true);
	loadedWidth = $loaded.outerWidth(true);

	$loaded.empty();
	$modal.css({"padding-bottom":interfaceHeight,"padding-right":interfaceWidth}).hide();//the padding removes the need to do size conversions during the animation step.

	//Archaic rollover code because IE8 is a piece of shit.  Hopefully they'll fix their css-rollover bug so the following code can be removed.
	$("#contentPrevious, #contentNext, #modalClose").live('mouseover', function(){$(this).addClass("hover");});
	$("#contentPrevious, #contentNext, #modalClose").live('mouseout', function(){$(this).removeClass("hover");});
});

$.fn.colorbox = function(settings, callback) {

	function modalPosition(mWidth, mHeight, speed, loadedCallback){
	
		var winHeight = document.documentElement.clientHeight;
		var posTop = winHeight/2 - mHeight/2;
		var posLeft = document.documentElement.clientWidth/2 - mWidth/2;
		//keeps the box from expanding to an inaccessible area offscreen.
		if(mHeight > winHeight){posTop -=(mHeight - winHeight);}
		if(posTop < 0){posTop = 0;} 
		if(posLeft < 0){posLeft = 0;}
	
		posTop+=$(window).scrollTop();
		posLeft+=$(window).scrollLeft();
	
		mWidth = mWidth - interfaceWidth;
		mHeight = mHeight - interfaceHeight;

		function modalDimensions(that){
			$modalContent[0].style.width = $borderTopCenter[0].style.width = $borderBottomCenter[0].style.width = that.style.width;
			$modalContent[0].style.height = $borderMiddleLeft[0].style.height = $borderMiddleRight[0].style.height = that.style.height;
		}

		$modal.animate({height:mHeight, width:mWidth, top:posTop, left:posLeft}, {duration: speed,
			complete: function(){
				if (loadedCallback) {loadedCallback();}
				modalDimensions(this);
				if ($.browser.msie && $.browser.version < 7) {setModalOverlay();}
			},
			step: function(){
				modalDimensions(this);		
			}
		});
	}
	var preloads = [];
	function preload(){
		if(settings.preloading !== false && related.length>1 && related[index].href.match(/\.(gif|png|jpg|jpeg|bmp)(?:\?([^#]*))?(?:#(.*))?$/i)){
			var previous, next;
			previous = index > 0 ? related[index-1].href : related[related.length-1].href;
			next = index < related.length-1 ? related[index+1].href : related[0].href;
			return [$("<img />").attr("src", next), $("<img />").attr("src", previous)];
		}
		return false;
	}
	
	function contentNav(){
		$loadingOverlay.show();
		if($(this).attr("id") == "contentPrevious"){
			index = index > 0 ? index-1 : related.length-1;
		} else {
			index = index < related.length-1 ? index+1 : 0;
		}
		loadModal(related[index].href, related[index].title);
		return false;
	}
	
	function centerModal (object, contentInfo){
		if($modal.data("open")!==true){ return false; }

		var speed = settings.transition=="none" ? 0 : settings.transitionSpeed;
		$loaded.remove();
		$loaded = $(object);
	
		$loaded.hide()
		.appendTo('body')
		.css({width:(settings.fixedWidth)?settings.fixedWidth - loadedWidth - interfaceWidth:$loaded.width()}).css({height:(settings.fixedHeight)?settings.fixedHeight - loadedHeight - interfaceHeight:$loaded.height()})
		.attr({id:"modalLoadedContent"})
		.append(contentInfo)
		.prependTo($modalContent);

		if($("#modalPhoto").length > 0 && settings.fixedHeight){
			var topMargin = (parseInt($loaded[0].style.height, 10) - parseInt($("#modalPhoto")[0].style.height, 10))/2;
			$("#modalPhoto").css({marginTop:(topMargin > 0?topMargin:0)});
		}
	
		function setPosition(s){
			modalPosition(parseInt($loaded[0].style.width, 10)+loadedWidth+interfaceWidth, parseInt($loaded[0].style.height, 10)+loadedHeight+interfaceHeight, s, function(){
				if($modal.data("open")!==true){
					return false;
				}
				$loaded.show();
				$loadingOverlay.hide();
				$(document).bind('keydown', keypressEvents);
				if (callback) {
					callback();
				}
				if (settings.transition === "fade"){
					$modal.animate({"opacity":1}, speed);
				}
				return true;
			});
		}
		if (settings.transition == "fade") {
			$modal.animate({"opacity":0}, speed, function(){setPosition(0);});
		} else {
			setPosition(speed);
		}
		var preloads = preload();
		return true;
	}
	
	function loadModal(href, title){
		clearLoading();
		var contentInfo = "<p id='contentTitle'>"+title+"</p>";
		if(related.length>1){
			contentInfo += "<span id='contentCurrent'> " + settings.contentCurrent + "</span>";
			contentInfo = contentInfo.replace(/\{current\}/, index+1).replace(/\{total\}/, related.length);
			contentInfo += "<a id='contentPrevious' href='#'>"+settings.contentPrevious+"</a><a id='contentNext' href='#'>"+settings.contentNext+"</a> ";
		}
		if (settings.inline) {
			loadingElement = $('<div id="colorboxInlineTemp" />').hide().insertBefore($(href)[0]);
			centerModal($(href).wrapAll("<div />").parent(), contentInfo);
		} else if (settings.iframe) {
			centerModal($("<div><iframe name='iframe_"+new Date().getTime()+" 'frameborder=0 src =" + href + "></iframe></div>"), contentInfo);//timestamp to prevent caching.
		} else if (href.match(/\.(gif|png|jpg|jpeg|bmp)(?:\?([^#]*))?(?:#(.*))?$/i)){
			loadingElement = new Image();
			loadingElement.onload = function(){
				loadingElement.onload = null;
				centerModal($("<div />").css({width:this.width, height:this.height}).append($(this).css({width:this.width, height:this.height, display:"block", margin:"auto"}).attr('id', 'modalPhoto')), contentInfo);
				if(related.length > 1){
					$(this).css({cursor:'pointer'}).click(contentNav);
				}
			};
			loadingElement.src = href;
		}else {
			loadingElement = $('<div />').load(href, function(data, textStatus){
				if(textStatus == "success"){
					centerModal($(this), contentInfo);
				} else {
					centerModal($("<p>Request unsuccessful.</p>"));
				}
			});
		}
	}

	settings = $.extend({}, $.fn.colorbox.settings, settings);
	
	$(this).unbind("click.colorbox").bind("click.colorbox", function () {
		if(settings.fixedWidth){ settings.fixedWidth = setSize(settings.fixedWidth, document.documentElement.clientWidth);}
		if(settings.fixedHeight){ settings.fixedHeight = setSize(settings.fixedHeight, document.documentElement.clientHeight);}
		if (this.rel && 'nofollow' != this.rel) {
			related = $("a[rel='" + this.rel + "']");
			index = $(related).index(this);
		}
		else {
			related = $(this);
			index = 0;
		}

		if ($modal.data("open") !== true) {
			$(document).bind('keydown', keypressEvents);
			$close.html(settings.modalClose);
			$overlay.css({"opacity": settings.bgOpacity}).show();
			$modal.data("open", true).css({"opacity":1});

			modalPosition(setSize(settings.initialWidth, document.documentElement.clientWidth), setSize(settings.initialHeight, document.documentElement.clientHeight), 0);

			if ($.browser.msie && $.browser.version < 7) {
				$(window).bind("resize scroll", setModalOverlay);
			}
		}

		loadModal(settings.href ? settings.href : related[index].href, settings.title ? settings.title : related[index].title);
		$("a#contentPrevious, a#contentNext").die().live("click", contentNav);

		if(settings.overlayClose!==false){
			$overlay.css({"cursor":"pointer"}).click(function(){$.fn.colorbox.close();});
		}
		return false;
	});

	if(settings.open!==false && $modal.data("open")!==true){
		$(this).triggerHandler('click.colorbox');
	}

	return this.each(function() { 
	});
};

//public function for closing colorbox.  To use this within an iframe use the following format: parent.$.fn.colorbox.close();
$.fn.colorbox.close = function(){

	$('#contentTitle').remove();
	clearLoading();
	$overlay.css({cursor:"auto"}).fadeOut("fast");
	$modal.stop(true, false).removeData("open").fadeOut("fast", function(){
		$loaded.remove();
	});
	$(document).unbind('keydown', keypressEvents);
	$(window).unbind('resize scroll', setModalOverlay);
	return false;
};

/*
	ColorBox Default Settings.
	
	The colorbox() function takes one argument, an object of key/value pairs, that are used to initialize the modal.
	
	Please do not change these settings here, instead overwrite these settings when attaching the colorbox() event to your anchors.
	Example (Global)	: $.fn.colorbox.settings.transition = "fade"; //changes the transition to fade for all colorBox() events proceeding it's declaration.
	Example (Specific)	: $("a[href='http://www.google.com']").colorbox({fixedWidth:"90%", fixedHeight:"450px", iframe:true});
*/
$.fn.colorbox.settings = {
	transition : "elastic", // Transition types: "elastic", "fade", or "none".
	transitionSpeed : 350, // Sets the speed of the fade and elastic transitions, in milliseconds.
	initialWidth : "400", // Set the initial width of the modal, prior to any content being loaded.
	initialHeight : "400", // Set the initial height of the modal, prior to any content being loaded.
	fixedWidth : false, // Set a fixed width for div#loaded.  Example: "500px"
	fixedHeight : false, // Set a fixed height for div#modalLoadedContent.  Example: "500px"
	inline : false, // Set this to the selector of inline content to be displayed.  Example "#myHiddenDiv" or "body p".
	iframe : false, // If 'true' specifies that content should be displayed in an iFrame.
	href : false, // This can be used as an alternate anchor URL for ColorBox to use, or can be used to assign a URL for non-anchor elments such as images or form buttons.
	title : false, // This can be used as an alternate anchor title.
	bgOpacity : 0.85, // The modalBackgroundOverlay opacity level. Range: 0 to 1.
	preloading : true, // Allows for preloading of 'Next' and 'Previous' content in a shared relation group (same values for the 'rel' attribute), after the current content has finished loading.  Set to 'false' to disable.
	contentCurrent : "image {current} of {total}", // the format of the contentCurrent information
	contentPrevious : "previous", // the anchor text for the previous link in a shared relation group (same values for 'rel').
	contentNext : "next", // the anchor text for the next link in a shared relation group (same 'rel' attribute').
	modalClose : "close", // the anchor text for the close link.  Esc will also close the modal.
	open : false, //Automatically opens ColorBox. (fires the click.colorbox event without waiting for user input).
	overlayClose : true  //If true, enables closing ColorBox by clicking on the background overlay.
};

})(jQuery);

