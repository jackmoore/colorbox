/*
	ColorBox v1.05 - a full featured, light-weight, customizable lightbox based on jQuery 1.3
	(c) 2009 Jack Moore - www.colorpowered.com - jack@colorpowered.com
	Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

(function($){
var loadedHeight, loadedWidth, interfaceHeight, interfaceWidth, index, related, closeModal, loadingElement, modal, modalOverlay, modalLoadingOverlay, modalContent, loaded, modalClose, btl, btc, btr, bml, bmr, bbl, bbc, bbr;
function setModalOverlay(){
	$([modalOverlay]).css({"position":"absolute", width:$(window).width(), height:$(window).height(), top:$(window).scrollTop(), left:$(window).scrollLeft()});
}
function keypressEvents(e){
	if(e.keyCode == 37){
		$("a#contentPrevious").click();
		$(document).unbind('keydown', keypressEvents);
	}
	else if(e.keyCode == 39){
		$("a#contentNext").click();
		$(document).unbind('keydown', keypressEvents);
	}
}
closeModal = function(){
	$(modal).removeData("open");
	$([modalOverlay, modal]).fadeOut("fast", function(){
		$(loaded).empty();
		$([modalOverlay, modal]).hide();//Seems unnecessary, but sometimes IE6 does not hide the modal.
	});
	if(loadingElement){$(loadingElement).remove();}
	$(document).unbind('keydown', keypressEvents);
	$(window).unbind('resize scroll', setModalOverlay);
};
// Convert % values to pixels
function setSize(size, dimension){
	return (typeof size == 'string') ? (size.match(/%/) ? (dimension/100)*parseInt(size) : parseInt(size)) : size;
}
function windowHeight(){return typeof window.innerHeight == 'number' ? window.innerHeight : document.documentElement.clientHeight;}
function windowWidth(){return typeof window.innerWidth == 'number' ? window.innerWidth : document.documentElement.clientWidth;}

//Initialize the modal: store common calculations, preload the interface graphics, append the html.
$(function(){
	$("body").append(
		$([
			modalOverlay = $('<div id="modalBackgroundOverlay" />')[0], 
			modal = $('<div id="colorbox" />')[0]
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
	loadedHeight = $(loaded).outerHeight(true);
	loadedWidth = $(loaded).outerWidth(true);
	$(modal).css({"padding-bottom":interfaceHeight,"padding-right":interfaceWidth}).hide();//the padding removes the need to do size conversions during the animation step.
});

$.fn.colorbox = function(settings) {

	settings = $.extend({}, $.fn.colorbox.settings, settings);

	//sets the position of the modal on screen.  A transition speed of 0 will result in no animation.
	function modalPosition(modalWidth, modalHeight, transitionSpeed, callback){
		var winHeight = windowHeight();
		var posTop = winHeight/2 - modalHeight/2 + $(window).scrollTop();
		var posLeft = $(window).width()/2 - modalWidth/2 + $(window).scrollLeft();
		//keeps the box from expanding to an inaccessible area offscreen.
		if(modalHeight > winHeight){posTop -=(modalHeight - winHeight);}
		if(posTop < 0){posTop = 0;} 
		if(posLeft < 0){posLeft = 0;}

		modalWidth = modalWidth - interfaceWidth;
		modalHeight = modalHeight - interfaceHeight;

		function modalDimensions(that){
			modalContent.style.width = btc.style.width = bbc.style.width = that.style.width;
			modalContent.style.height = bml.style.height = bmr.style.height = that.style.height;
		}

		$(modal).animate({height:modalHeight, width:modalWidth, top:posTop, left:posLeft}, {duration: transitionSpeed,
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
		$(loaded)
		.css({"height":(settings.fixedHeight)?settings.fixedHeight - loadedHeight - interfaceHeight:"auto", "width":(settings.fixedWidth)?settings.fixedWidth - loadedWidth - interfaceWidth:"auto"})
		.hide().html(contentHtml).append(contentInfo);

		if (settings.transition == "elastic") {
			modalPosition($(loaded).outerWidth(true)+interfaceWidth, $(loaded).outerHeight(true)+interfaceHeight, settings.transitionSpeed, function(){
				$(loaded).show();
				$(modalLoadingOverlay).hide();
			});
		}
		else {
			if(settings.transition=="none"){settings.transitionSpeed = 0}
			$(modal).animate({"opacity":0}, settings.transitionSpeed, function(){
				modalPosition($(loaded).outerWidth(true)+interfaceWidth, $(loaded).outerHeight(true)+interfaceHeight, 0, function(){
					$(loaded).show();
					$(modalLoadingOverlay).hide();
					$(modal).animate({"opacity":1}, settings.transitionSpeed);
				});
			});
		}
		var preloads = preload();
	}

	function buildGallery(that){

		var contentInfo = "<span id='contentTitle'>"+that.title+"</span>";
		
		if(related.length>1){
			contentInfo += "<span id='contentCurrent'> " + settings.contentCurrent + "</span>";
			contentInfo = contentInfo.replace(/\{current\}/, index+1).replace(/\{total\}/, related.length);
			contentInfo += "<a id='contentPrevious' href='#'>"+settings.contentPrevious+"</a> ";
			contentInfo += "<a id='contentNext' href='#'>"+settings.contentNext+"</a> ";
		}

		if (settings.contentInline) {
			centerModal($(settings.contentInline).html(), contentInfo);
		} else if (settings.contentIframe) {
			centerModal("<iframe  frameborder=0 src =" + that.href + "></iframe>", contentInfo);
		} else if (that.href.match(/.(gif|png|jpg|jpeg|bmp|tif)$/i) && !settings.contentAjax){
			loadingElement = $("<img />").load(function(){
				centerModal("<a id='imageNext' href='#'><img src='"+that.href+"' alt='' /></a>", contentInfo);
			}).attr("src",that.href);
		}else {
			loadingElement = $('<div></div>').load(((settings.contentAjax) ? settings.contentAjax : that.href), function(data, textStatus){
				if(textStatus == "success"){
					centerModal($(this).html(), contentInfo);
				} else {
					centerModal("<p>Ajax request unsuccessful</p>");
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
			$("a#contentPrevious, a#contentNext, a#imageNext").die().live("click", contentNav);
			$(document).bind('keydown', keypressEvents);
			if ($.browser.msie && $.browser.version < 7) {
				$(window).bind("resize scroll", setModalOverlay);
			}
		}
		return false;
	});

	if(settings.overlayClose!==false){
		$(modalOverlay).css({"cursor":"pointer"}).click(function(){closeModal();});
	}

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
	initialWidth : "50%", // Set the initial width of the modal, prior to any content being loaded.
	initialHeight : "50%", // Set the initial height of the modal, prior to any content being loaded.
	fixedWidth : false, // Set a fixed width for div#loaded.  Example: "500px"
	fixedHeight : false, // Set a fixed height for div#modalLoadedContent.  Example: "500px"
	contentAjax : false, // Set this to the file, or file+selector of content that will be loaded through an external file.  Example "include.html" or "company.inc.php div#ceo_bio"
	contentInline : false, // Set this to the selector, in jQuery selector format, of inline content to be displayed.  Example "#myHiddenDiv".
	contentIframe : false, // If 'true' specifies that content should be displayed in an iFrame.
	bgOpacity : 0.85, // The modalBackgroundOverlay opacity level. Range: 0 to 1.
	preloading : true, // Allows for preloading of 'Next' and 'Previous' content in a shared relation group (same values for the 'rel' attribute), after the current content has finished loading.  Set to 'false' to disable.
	contentCurrent : "{current} of {total}", // the format of the contentCurrent information
	contentPrevious : "previous", // the anchor text for the previous link in a shared relation group (same values for 'rel').
	contentNext : "next", // the anchor text for the next link in a shared relation group (same 'rel' attribute').
	modalClose : "close", // the anchor text for the close link.  Esc will also close the modal.
	open : false, //Automatically opens ColorBox. (fires the click.colorbox event without waiting for user input).
	overlayClose : false  //If true, enables closing ColorBox by clicking on the background overlay.
};

})(jQuery);

