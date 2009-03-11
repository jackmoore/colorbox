/*
	ColorBox v1.05 - a full featured, light-weight, customizable lightbox based on jQuery 1.3
	(c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
	Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

(function($){

var index, related, loadingElement, modal, modalOverlay, modalLoading, modalContent, modalLoadedContent, modalClose, borderTopLeft, borderTopCenter, borderTopRight, borderMiddleLeft, borderMiddleRight, borderBottomLeft, borderBottomCenter, borderBottomRight;

$(function(){
	//Initialize the modal, preload the interface graphics, and wait until called.
	$("body").append(
		$([
			modalOverlay = $('<div id="modalBackgroundOverlay" />')[0], 
			modal = $('<div id="colorbox" />')[0]
		]).hide()
	);

	$(modal).append(
		$([
			borderTopLeft = $('<div id="borderTopLeft" />')[0],
			borderTopCenter = $('<div id="borderTopCenter" />')[0],
			borderTopRight = $('<div id="borderTopRight" />')[0],
			borderMiddleLeft = $('<div id="borderMiddleLeft" />')[0],
			borderMiddleRight = $('<div id="borderMiddleRight" />')[0],
			borderBottomLeft = $('<div id="borderBottomLeft" />')[0],
			borderBottomCenter = $('<div id="borderBottomCenter" />')[0],
			borderBottomRight = $('<div id="borderBottomRight" />')[0],
			modalContent = $('<div id="modalContent" />')[0]
		])
	);
	
	$(modalContent).append(
		$([
			modalLoadedContent = $('<div id="modalLoadedContent"><a id="contentPrevious" href="#"></a><a id="contentNext" href="#"></a><span id="contentCurrent"></span><br id="modalInfoBr"/><span id="contentTitle"></span><div id="preloadPrevious"></div><div id="preloadNext"></div><div id="preloadClose"></div></div>')[0], 
			modalLoadingOverlay = $('<div id="modalLoadingOverlay" />')[0],
			modalClose = $('<a id="modalClose" href="#"></a>')[0]
		])
	);

	$(modalClose).click(function(){
		closeModal();
		return false;
	});
});

function setModalOverlay(){
	$([modalOverlay]).css({"position":"absolute", width:$(window).width(), height:$(window).height(), top:$(window).scrollTop(), left:$(window).scrollLeft()});
}

function keypressEvents(e){
	if(e.keyCode == 27){
		closeModal();
		return false;
	}
	else if(e.keyCode == 37){
		$("a#contentPrevious").click();
		return false;
	}
	else if(e.keyCode == 39){
		$("a#contentNext").click();
		return false
	}
}

function closeModal(){
	$(modal).removeData("open");
	$([modalOverlay, modal]).fadeOut("fast", function(){
		$(modalLoadedContent).empty();
		$([modalOverlay, modal]).hide();//Seems unnecessary, but sometimes IE6 does not hide the modal.
	});
	if(loadingElement){$(loadingElement).remove()};
	$(document).unbind('keydown', keypressEvents);
	$(window).unbind('resize scroll', setModalOverlay);
}

$.fn.colorbox = function(settings) {

	settings = $.extend({}, $.fn.colorbox.settings, settings);

	//sets the position of the modal on screen.  A transition speed of 0 will result in no animation.
	function modalPosition(modalWidth, modalHeight, transitionSpeed, callback){
		var windowHeight;
		(typeof(window.innerHeight)=='number')?windowHeight=window.innerHeight:windowHeight=document.documentElement.clientHeight;
		var colorboxHeight = modalHeight + $(borderTopLeft).height() + $(borderBottomLeft).height();
		var colorboxWidth = modalWidth + $(borderTopLeft).width() + $(borderBottomLeft).width();
		var posTop = windowHeight/2 - colorboxHeight/2 + $(window).scrollTop();
		var posLeft = $(window).width()/2 - colorboxWidth/2 + $(window).scrollLeft();
		if(colorboxHeight > windowHeight){
			posTop -=(colorboxHeight - windowHeight);
		}
		if(posTop < 0){posTop = 0;} //keeps the box from expanding to an inaccessible area offscreen.
		if(posLeft < 0){posLeft = 0;}
		$(modal).animate({height:colorboxHeight, top:posTop, left:posLeft, width:colorboxWidth}, transitionSpeed);

		//each part is animated seperately to keep them from disappearing during the animation process, which is what would happen if they were positioned relative to a single element being animated.
		$(borderMiddleLeft).animate({top:$(borderTopLeft).height(), left:0, height:modalHeight}, transitionSpeed);
		$(borderMiddleRight).animate({top:$(borderTopRight).height(), left:colorboxWidth-$(borderMiddleRight).width(), height:modalHeight}, transitionSpeed);

		$(borderTopLeft).animate({top:0, left:0}, transitionSpeed);
		$(borderTopCenter).animate({top:0, left:$(borderTopLeft).width(), width:modalWidth}, transitionSpeed);
		$(borderTopRight).animate({top: 0, left: colorboxWidth - $(borderTopRight).width()}, transitionSpeed);

		$(borderBottomLeft).animate({top:colorboxHeight-$(borderBottomLeft).height(), left:0}, transitionSpeed);
		$(borderBottomCenter).animate({top:colorboxHeight-$(borderBottomLeft).height(), left:$(borderBottomLeft).width(), width:modalWidth}, transitionSpeed);
		$(borderBottomRight).animate({top: colorboxHeight - $(borderBottomLeft).height(),	left: colorboxWidth - $(borderBottomRight).width()}, transitionSpeed);
		$(modalContent).animate({height:modalHeight, width:modalWidth, top:$(borderTopLeft).height(), left:$(borderTopLeft).width()}, transitionSpeed, function(){
			if(callback){callback();}
			if($.browser.msie && $.browser.version < 7){
				setModalOverlay();
			}
		});	
	}
	
	var preloads = [];

	function preload(){
		if(settings.preloading == true && related.length>1){
			var previous, next;
			index > 0 ? previous = related[index-1].href : previous = related[related.length-1].href;
			index < related.length-1 ? next = related[index+1].href : next = related[0].href;
			return [$(new Image()).attr("src", next), $(new Image()).attr("src", previous)];
		}
	}
	
	function centerModal(contentHtml, contentInfo){
		$(modalLoadedContent).hide().html(contentHtml).append(contentInfo);
		if(settings.contentWidth){$(modalLoadedContent).css({"width":settings.contentWidth})}
		if(settings.contentHeight){$(modalLoadedContent).css({"height":settings.contentHeight})}
		if (settings.transition == "elastic") {
			modalPosition($(modalLoadedContent).outerWidth(true), $(modalLoadedContent).outerHeight(true), settings.transitionSpeed, function(){
				$(modalLoadedContent).show();
				$(modalLoadingOverlay).hide();
			});
			
		}
		else {
			$(modal).animate({"opacity":0}, settings.transitionSpeed, function(){
				modalPosition($(modalLoadedContent).outerWidth(true), $(modalLoadedContent).outerHeight(true), 0, function(){
					$(modalLoadedContent).show();
					$(modalLoadingOverlay).hide();
					$(modal).animate({"opacity":1}, settings.transitionSpeed);
				});
			});
		}
		var preloads = preload();
	}
	
	function contentNav(){
		$(modalLoadingOverlay).show();
		if($(this).attr("id") == "contentPrevious"){
			index > 0 ? index-- : index=related.length-1;
		} else {
			index < related.length-1 ? index++ : index = 0;
		}
		buildGallery(related[index]);
		return false;	
	}
	
	function buildGallery(that){

		var contentInfo = "<br id='modalInfoBr'/><span id='contentTitle'>"+that.title+"</span>";
		
		if(related.length>1){
			contentInfo += "<span id='contentCurrent'> " + settings.contentCurrent + "</span>"
			contentInfo = contentInfo.replace(/{current}/, index+1).replace(/{total}/, related.length)
			contentInfo += "<a id='contentPrevious' href='#'>"+settings.contentPrevious+"</a> "
			contentInfo += "<a id='contentNext' href='#'>"+settings.contentNext+"</a> "
		}

		if (settings.contentInline) {
			centerModal($(settings.contentInline).html(), contentInfo);
		} else if (settings.contentIframe) {
			centerModal("<iframe src =" + that.href + "></iframe>", contentInfo);
		} else if (that.href.match(/.(gif|png|jpg|jpeg|bmp|tif)$/i) && !settings.contentAjax){
			loadingElement = $(new Image()).load(function(){
				centerModal("<img src='"+that.href+"' alt=''/>", contentInfo);
			}).attr("src",that.href);
		}else {
			loadingElement = $('<div></div>').load(((settings.contentAjax) ? settings.contentAjax : that.href), function(data, textStatus){
				if(textStatus == "success"){centerModal($(this).html(), contentInfo)
				} else {
				centerModal("<p>Ajax request unsuccessful</p>");
				}
			});
		}
	};
	
	$(this).bind("click.colorbox", function () {
		if ($(modal).data("open") != true) {
			$(modal).data("open", true);
			$(modalLoadedContent).empty().css({
				"height": "auto",
				"width": "auto"
			});
			$(modalClose).html(settings.modalClose);
			$(modalOverlay).css({
				"opacity": settings.bgOpacity
			});
			$([modalOverlay, modal, modalLoadingOverlay]).show();
			$(modalContent).css({
				width: settings.initialWidth,
				height: settings.initialHeight
			});
			modalPosition($(modalContent).width(), $(modalContent).height(), 0);
			if (this.rel) {
				related = $("a[rel='" + this.rel + "']");
				index = $(related).index(this);
			}
			else {
				related = $(this);
				index = 0;
			}
			buildGallery(related[index]);
			$("a#contentPrevious, a#contentNext").die().live("click", contentNav);
			$(document).bind('keydown', keypressEvents);
			if ($.browser.msie && $.browser.version < 7) {
				$(window).bind("resize scroll", setModalOverlay);
			}
		}
		return false;
	});

	if(settings.open==true && $(modal).data("open")!=true){
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
	Example (Specific)	: $("a[href='http://www.google.com']").colorbox({contentWidth:"700px", contentHeight:"450px", contentIframe:true});
*/
$.fn.colorbox.settings = {
	transition : "elastic", // "elastic" or "fade". Set transitionSpeed to 0 for no transition.
	transitionSpeed : 350, // Sets the speed of the fade and elastic transition, in milliseconds. Set to 0 for no transition.
	initialWidth : 300, // Set the initial width of the modal, prior to any content being loaded.
	initialHeight : 100, // Set the initial height of the modal, prior to any content being loaded.
	contentWidth : false, // Set a fixed width for div#modalLoadedContent.  Example: "500px"
	contentHeight : false, // Set a fixed height for div#modalLoadedContent.  Example: "500px"
	contentAjax : false, // Set this to the file, or file+selector of content that will be loaded through an external file.  Example "include.html" or "company.inc.php div#ceo_bio"
	contentInline : false, // Set this to the selector, in jQuery selector format, of inline content to be displayed.  Example "#myHiddenDiv".
	contentIframe : false, // If 'true' specifies that content should be displayed in an iFrame.
	bgOpacity : 0.85, // The modalBackgroundOverlay opacity level. Range: 0 to 1.
	preloading : true, // Allows for preloading of 'Next' and 'Previous' content in a shared relation group (same values for the 'rel' attribute), after the current content has finished loading.  Set to 'false' to disable.
	contentCurrent : "{current} of {total}", // the format of the contentCurrent information
	contentPrevious : "previous", // the anchor text for the previous link in a shared relation group (same values for 'rel').
	contentNext : "next", // the anchor text for the next link in a shared relation group (same 'rel' attribute').
	modalClose : "close", // the anchor text for the close link.  Esc will also close the modal.
	open : false //Automatically opens ColorBox. (fires the click.colorbox event without waiting for user input).
}

})(jQuery);

