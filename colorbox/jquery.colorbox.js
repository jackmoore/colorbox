/*
	ColorBox v1.05 - a full featured, light-weight, customizable lightbox based on jQuery 1.3
	(c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
	Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

(function($){
var interfaceHeight, interfaceWidth, index, related, closeModal, loadingElement, modal, modalWrap, modalOverlay, modalLoadingOverlay, modalContent, loaded, modalClose, btl, btc, btr, bml, bmr, bbl, bbc, bbr;
function setModalOverlay(){
	$([modalOverlay]).css({"position":"absolute", width:$(window).width(), height:$(window).height(), top:$(window).scrollTop(), left:$(window).scrollLeft()});
}
function keypressEvents(e){
	if(e.keyCode == 37){
		$(document).unbind('keydown', keypressEvents);
		$("a#contentPrevious").click();
	}
	else if(e.keyCode == 39){
		$(document).unbind('keydown', keypressEvents);
		$("a#contentNext").click();
	}
}
closeModal = function(){
	$(modal).removeData("open");
	$([modalOverlay, modal]).css({cursor:"auto"}).fadeOut("fast", function(){
		$([loaded, modalTemp]).empty();
	});
	if(loadingElement){$(loadingElement).remove();}
	$(document).unbind('keydown', keypressEvents);
	$(window).unbind('resize scroll', setModalOverlay);
};
// Convert % values to pixels
function setSize(size, dimension){
	return (typeof size == 'string') ? (size.match(/%/) ? (dimension/100)*parseInt(size, 10) : parseInt(size, 10)) : size;
}
function windowHeight(){return typeof window.innerHeight == 'number' ? window.innerHeight : document.documentElement.clientHeight;}
function windowWidth(){return typeof window.innerWidth == 'number' ? window.innerWidth : document.documentElement.clientWidth;}

//Initialize the modal: store common calculations, preload the interface graphics, append the html.
$(function(){
	$("body").append(
		$([
			modalOverlay = $('<div id="modalBackgroundOverlay" />')[0], 
			modal = $('<div id="colorbox" />')[0],
			modalTemp = $('<div id="modalTemp" />')[0]
		]).hide()
	);
	$(modal).append(
		$([
			modalWrap = $('<div id="modalWrap" />')[0]
		])
	);
	$(modalWrap).append(
		$([
			btl = $('<div id="borderTopLeft" />')[0],
			btc = $('<div id="borderTopCenter" />')[0],
			btr = $('<div id="borderTopRight" />')[0],
			$("<br />")[0],
			bml = $('<div id="borderMiddleLeft" />')[0],
			modalContent = $('<div id="modalContent" />')[0],
			bmr = $('<div id="borderMiddleRight" />')[0],
			$("<br />")[0],
			bbl = $('<div id="borderBottomLeft" />')[0],
			bbc = $('<div id="borderBottomCenter" />')[0],
			bbr = $('<div id="borderBottomRight" />')[0]
		])
	);
	$(modalContent).append(
		$([
			loaded = $('<div id="modalLoadedContent"><a id="contentPrevious" href="#"></a><a id="contentNext" href="#"></a><span id="contentCurrent"></span><br id="modalInfoBr"/><span id="contentTitle"></span><div id="preloadPrevious"></div><div id="preloadNext"></div><div id="preloadClose"></div></div>')[0], 
			modalLoadingOverlay = $('<div id="modalLoadingOverlay" />')[0],
			modalClose = $('<a id="modalClose" href="#"></a>')[0]
		])
	);
	$(modalClose).click(function(){
		closeModal();
		return false;
	});
	$(document).bind('keydown', function(e){if(e.keyCode == 27){closeModal();}});

	$(modal).css("opacity", 0).show();
	interfaceHeight = $(btc).height()+$(bbc).height();
	interfaceWidth = $(bml).width()+$(bmr).width();
	$(modal).css({"padding-bottom":interfaceHeight,"padding-right":interfaceWidth}).hide();//the padding removes the need to do size conversions during the animation step.

	if ($.browser.msie && $.browser.version > 7) {$(modalWrap).css({position:"static"});}//IE8 creates a completely unnecessary horizontal scrollbar.  I've submitted a bug report with the details - hopefully MS will fix this for the public release.
});

$.fn.colorbox = function(settings) {

	settings = $.extend({}, $.fn.colorbox.settings, settings);

	//sets the position of the modal on screen.  A transition speed of 0 will result in no animation.
	function modalPosition(mWidth, mHeight, speed, callback){

		var winHeight = windowHeight();
		var posTop = winHeight/2 - mHeight/2 + $(window).scrollTop();
		var posLeft = $(window).width()/2 - mWidth/2 + $(window).scrollLeft();
		//keeps the box from expanding to an inaccessible area offscreen.
		if(mHeight > winHeight){posTop -=(mHeight - winHeight);}
		if(posTop < 0){posTop = 0;} 
		if(posLeft < 0){posLeft = 0;}

		mWidth = mWidth - interfaceWidth;
		mHeight = mHeight - interfaceHeight;

		function modalDimensions(that){
			modalContent.style.width = btc.style.width = bbc.style.width = that.style.width;
			modalContent.style.height = bml.style.height = bmr.style.height = that.style.height;
		}
		$(modal).animate({height:mHeight, width:mWidth, top:posTop, left:posLeft}, {duration: speed,
			complete: function(){
				if (callback) {callback();}
				modalDimensions(this);
				$(document).bind('keydown', keypressEvents);
				if ($.browser.msie && $.browser.version < 7) {setModalOverlay();}
			},
			step: function(){
				modalDimensions(this);		
			}
		});
	}

	var preloads = [];

	function preload(){
		if(settings.preloading !== false && related.length>1){
			var previous, next;
			previous = index > 0 ? related[index-1].href : related[related.length-1].href;
			next = index < related.length-1 ? related[index+1].href : related[0].href;
			return [$("<img />").attr("src", next), $("<img />").attr("src", previous)];
		}
	}
	
	function centerModal(contentHtml, contentInfo){
		var speed = settings.transition=="none" ? 0 : settings.transitionSpeed;
		$(loaded).hide().css({width:0, height:0});
		$(modalTemp).css({width:(settings.fixedWidth)?settings.fixedWidth - $(loaded).outerWidth(true) - interfaceWidth:"auto", height:(settings.fixedHeight)?settings.fixedHeight - $(loaded).outerHeight(true) - interfaceHeight:"auto"}).html(contentHtml);
		$(loaded).html(contentHtml).append(contentInfo).css({height:$(modalTemp).height(), width:$(modalTemp).width()});
		
		function setPosition(s){
			modalPosition($(loaded).outerWidth(true)+interfaceWidth, $(loaded).outerHeight(true)+interfaceHeight, s, function(){
				$(loaded).show();
				$(modalLoadingOverlay).hide();
				if (settings.transition == "fade"){$(modal).animate({"opacity":1}, speed);}
			});
		}
		if (settings.transition == "fade") {
			$(modal).animate({"opacity":0}, speed, function(){setPosition(0);});
		} else {
			setPosition(speed);
		}
		var preloads = preload();
	}

	function buildGallery(that){
		var href = settings.href ? settings.href : that.href;
		var contentInfo = "<span id='contentTitle'>"+that.title+"</span>";
		
		if(related.length>1){
			contentInfo += "<span id='contentCurrent'> " + settings.contentCurrent + "</span>";
			contentInfo = contentInfo.replace(/\{current\}/, index+1).replace(/\{total\}/, related.length);
			contentInfo += "<a id='contentPrevious' href='#'>"+settings.contentPrevious+"</a> ";
			contentInfo += "<a id='contentNext' href='#'>"+settings.contentNext+"</a> ";
		}
		if (settings.inline) {
			centerModal($(href).html(), contentInfo);
		} else if (settings.iframe) {
			centerModal("<iframe  frameborder=0 src =" + href + "></iframe>", contentInfo);
		} else if (href.match(/.(gif|png|jpg|jpeg|bmp|tif)$/i)){
			loadingElement = $("<img />").load(function(){
				centerModal("<img id='imageNext' src='"+href+"' alt='' "+(settings.fixedWidth ? "style='margin:auto'" : "")+" />", contentInfo);
			}).attr("src",href);
		}else {
			loadingElement = $('<div></div>').load(href, function(data, textStatus){
				if(textStatus == "success"){
					centerModal($(this).html(), contentInfo);
				} else {
					centerModal("<p>Request unsuccessful.</p>");
				}
			});
		}
	}

	function contentNav(){
		$(modalLoadingOverlay).show();
		if($(this).attr("id") == "contentPrevious"){
			index = index > 0 ? index-1 : related.length-1;
		} else {
			index = index < related.length-1 ? index+1 : 0;
		}
		buildGallery(related[index]);
		return false;	
	}

	$(this).bind("click.colorbox", function () {
		if ($(modal).data("open") !== true) {
			$(modal).data("open", true);
			if(settings.fixedWidth){ settings.fixedWidth = setSize(settings.fixedWidth, windowWidth());}
			if(settings.fixedHeight){ settings.fixedHeight = setSize(settings.fixedHeight, windowHeight());}
			$(modalClose).html(settings.modalClose);
			$(modalOverlay).css({"opacity": settings.bgOpacity});
			$([modal, modalLoadingOverlay, modalOverlay]).show();

			modalPosition(setSize(settings.initialWidth, windowWidth()), setSize(settings.initialHeight, windowHeight()), 0);

			if (this.rel) {
				related = $("a[rel='" + this.rel + "']");
				index = $(related).index(this);
			}
			else {
				related = $(this);
				index = 0;
			}
			$(modal).css({"opacity":1});
			buildGallery(related[index]);
			$("a#contentPrevious, a#contentNext, #imageNext").die().live("click", contentNav);
			$(document).bind('keydown', keypressEvents);
			if ($.browser.msie && $.browser.version < 7) {
				$(window).bind("resize scroll", setModalOverlay);
			}
		}
		if(settings.overlayClose!==false){
			$(modalOverlay).css({"cursor":"pointer"}).click(function(){closeModal();});
		}
		return false;
	});


	if(settings.open!==false && $(modal).data("open")!==true){
		$(this).triggerHandler('click.colorbox');
	}

	return this.each(function() { 
	});
};

/*
	ColorBox Default Settings.
	
	The colorbox() function takes one argument, an object of key/value pairs, that are used to initialize the modal.
	
	Please do not change these settings here, instead overwrite these settings when attaching the colorbox() event to your anchors.
	Example (Global)	: $.fn.colorbox.settings.transition = "fade"; //changes the transition to fade for all colorBox() events proceeding it's declaration.
	Example (Specific)	: $("a[href='http://www.google.com']").colorbox({fixedWidth:"700px", fixedHeight:"450px", contentIframe:true});
*/
$.fn.colorbox.settings = {
	transition : "elastic", // Transition types: "elastic", "fade", or "none".
	transitionSpeed : 350, // Sets the speed of the fade and elastic transitions, in milliseconds.
	initialWidth : "500", // Set the initial width of the modal, prior to any content being loaded.
	initialHeight : "500", // Set the initial height of the modal, prior to any content being loaded.
	fixedWidth : false, // Set a fixed width for div#loaded.  Example: "500px"
	fixedHeight : false, // Set a fixed height for div#modalLoadedContent.  Example: "500px"
	inline : false, // Set this to the selector, in jQuery selector format, of inline content to be displayed.  Example "#myHiddenDiv".
	iframe : false, // If 'true' specifies that content should be displayed in an iFrame.
	href : false, 
	loadingAnimationSteps:15,
	bgOpacity : 0.85, // The modalBackgroundOverlay opacity level. Range: 0 to 1.
	preloading : true, // Allows for preloading of 'Next' and 'Previous' content in a shared relation group (same values for the 'rel' attribute), after the current content has finished loading.  Set to 'false' to disable.
	contentCurrent : "{current} of {total}", // the format of the contentCurrent information
	contentPrevious : "previous", // the anchor text for the previous link in a shared relation group (same values for 'rel').
	contentNext : "next", // the anchor text for the next link in a shared relation group (same 'rel' attribute').
	modalClose : "close", // the anchor text for the close link.  Esc will also close the modal.
	open : false, //Automatically opens ColorBox. (fires the click.colorbox event without waiting for user input).
	overlayClose : true  //If true, enables closing ColorBox by clicking on the background overlay.
};

})(jQuery);

