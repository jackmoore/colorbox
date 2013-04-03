/*!
    jQuery ColorBox v2.0.0-alpha - 2013-02-09
    (c) 2013 Jack Moore - jacklmoore.com/colorbox
    license: http://www.opensource.org/licenses/mit-license.php
*/

(function ($, document, window) {

    // Don't do anything if ColorBox already exists.
    if ($.colorbox) { return; }

    var
    // Default settings object.
    // See http://jacklmoore.com/colorbox for details.
    defaults = {
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
        fastIframe: true,
        photo: false,
        href: function() { return $(this).attr('href'); },
        title: function() { return $(this).attr('title'); },
        rel: function() { return $(this).attr('data-rel'); },
        opacity: 0.9,
        preloading: true,
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
        onLoad: false,
        onComplete: false,
        onCleanup: false,
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
        "</div>",


        events: {
            closeButton: function(){
                $(document).on('click.cbox', '.cbox-close', $.colorbox.close);
            },
            nextButton: function(){
                $(document).on('click.cbox', '.cbox-next', $.colorbox.next);
            },
            prevButton: function(){
                $(document).on('click.cbox', '.cbox-prev', $.colorbox.prev);
            },
            overlay: function(){
                $(document).on('click.cbox', '.cbox-root', function(e){
                    if (e.target === this) {
                        $.colorbox.close();
                    }
                });
            },
            esc: function(){
                $(window).on('keydown.cbox', function (e) {
                    if (e.keyCode === 27) {
                        e.preventDefault();
                        $.colorbox.close();
                    }
                });
            },
            leftArrow: function(){
                $(window).on('keydown.cbox', function (e) {
                    if (e.keyCode === 37 && $.colorbox.group.length) {
                        e.preventDefault();
                        $.colorbox.prev();
                    }
                });
            },
            rightArrow: function(){
                $(window).on('keydown.cbox', function (e) {
                    if (e.keyCode === 39 && $.colorbox.group.length) {
                        e.preventDefault();
                        $.colorbox.next();
                    }
                });
            },
            resize: function(){
                $(window).on('resize.cbox', function(){
                    $.colorbox.position();
                });
            }
        }
    },
    
    // Events
    $events = $({}),
    event_open = 'cbox.open',
    event_load = 'cbox.load',
    event_complete = 'cbox.complete',
    event_cleanup = 'cbox.cleanup',
    event_closed = 'cbox.closed',
    event_purge = 'cbox.purge',


    // Cached jQuery Object Variables
    $window = $(window),

    $root,
    $body,
    $content,
    $title,
    $current,
    $next,
    $prev,
    $close,
    

    // Variables for cached values or use across multiple functions
    settings,
    cache = {},
    interfaceHeight,
    interfaceWidth,
    element,
    open,
    active,
    closing,
    loadingTimer,
    size; // computed size

    // ****************
    // HELPER FUNCTIONS
    // ****************

    // Determine the next and previous members in a group.
    function getIndex(increment) {
        var
        max = $.colorbox.group.length,
        newIndex = ($.colorbox.index + increment) % max;
        
        return (newIndex < 0) ? max + newIndex : newIndex;
    }

    // Convert '%' and 'px' values to integers
    function setSize(size, dimension) {
        return Math.round((/%/.test(size) ? ((dimension === 'x' ? $window.width() : $window.height()) / 100) : 1) * parseInt(size, 10));
    }
    
    // Checks an href to see if it is a photo.
    // There is a force photo option (photo: true) for hrefs that cannot be matched by the regex.
    function isImage(url) {
        return settings.photo || settings.photoRegex.test(url);
    }

    function retinaUrl(url) {
        return settings.retinaUrl && window.devicePixelRatio > 1 ? url.replace(settings.photoRegex, settings.retinaSuffix) : url;
    }

    // Assigns function results to their respective properties
    function makeSettings(options) {
        settings = $.extend({}, defaults, options);
        // console.log(options);
        $.each(settings, function(i){
            if ($.isFunction(settings[i]) && i.slice(0, 2) !== 'on') { // checks to make sure the function isn't one of the callbacks, they will be handled at the appropriate time.
                settings[i] = settings[i].call(element);
            }
        });
    }

    function trapFocus(e) {
        if (!$.contains($body[0], e.target) && $body[0] !== e.target) {
            e.stopPropagation();
            $body.focus();
        }
    }

    function trigger(event, callback) {
        // for external use
        $(document).trigger(event);

        // for internal use
        $events.trigger(event);

        if ($.isFunction(callback)) {
            callback.call(element);
        }
    }

    function launch(target) {
        if (!closing) {
            
            element = target;

            $.each(cache, function(i){
                if ($(element).is(i)) {
                    makeSettings(cache[i]);
                }
            });

            if (!open) {
                open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.
                
                $(document.body).addClass('js-cbox');

                appendHTML();
                // Cache values needed for size calculations
                interfaceHeight = $body.outerHeight(true);
                interfaceWidth = $body.outerWidth(true);
                
                $root.css({visibility:'visible'});

                // Opens inital empty ColorBox prior to content being loaded.
                size = {};
                size.width = setSize(settings.initialWidth, 'x');
                size.height = setSize(settings.initialHeight, 'y');
                $.colorbox.position();
                
                trigger(event_open, settings.onOpen);

                $title.hide();
                
                $close.html(settings.close).show();

                if (settings.group) {
                    $.colorbox.group = $(settings.group);

                    $.colorbox.index = $.colorbox.group.index(element);

                    if ($.colorbox.index === -1) {
                        $.colorbox.group = $.colorbox.group.add(element);
                        $.colorbox.index = $.colorbox.group.length - 1;
                    }
                } else {
                    $.colorbox.index = 0;
                    $.colorbox.group = $(element);
                }

                $body.focus();
                
                // Confine focus to the modal
                // Uses event capturing, therefor is unsupported in IE8.
                if (document.addEventListener) {
                    document.addEventListener('focus', trapFocus, true);
                    $events.one(event_closed, function () {
                        document.removeEventListener('focus', trapFocus, true);
                    });
                }

                // Return focus on closing
                if (settings.returnFocus) {
                    $events.one(event_closed, function () {
                        $(element).focus();
                    });
                }
            }
            
            load();
        }
    }

    // ColorBox's markup needs to be added to the DOM prior to being called
    // so that the browser will go ahead and load the CSS background images.
    function appendHTML() {
        if (document.body) {
            
            $root = $(defaults.structure);

            $body = $('.cbox-body', $root);
            $content = $('.cbox-content', $root);
            $prev = $('.cbox-prev', $root);
            $next = $('.cbox-next', $root);
            $current = $('.cbox-current', $root);
            $title = $('.cbox-title', $root);
            $close = $('.cbox-close', $root);
            
            $root
                .css({visibility:'hidden'})
                .appendTo(document.body);

            $.each(settings.events, function(){
                if ($.isFunction(this)) {
                    this();
                }
            });
        }
    }


    // ****************
    // PUBLIC FUNCTIONS
    // Usage format: $.colorbox.close();
    // Usage from within an iframe: parent.$.colorbox.close();
    // ****************

    $.colorbox = function (selector, options) {
        if (!selector) { return; }

        var first = $(selector)[0];

        cache[selector] = options;

        $(document).on('click', selector, function(e){
            // ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
            // See: http://jacklmoore.com/notes/click-events/
            if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey)) {
                e.preventDefault();
                launch(this);
            }
        });

        if (options.open && first) {
            launch(first);
        }
    };


    $.colorbox.position = function (speed, loadedCallback) {
        var
        css,
        top = 0,
        left = 0;

        // keeps the top and left positions within the browser's viewport.
        if (settings.right !== false) {
            left += Math.max($window.width() - size.width - interfaceWidth - setSize(settings.right, 'x'), 0);
        } else if (settings.left !== false) {
            left += setSize(settings.left, 'x');
        } else {
            left += Math.round(Math.max($window.width() - size.width - interfaceWidth, 0) / 2);
        }
        
        if (settings.bottom !== false) {
            top += Math.max($window.height() - size.height - interfaceHeight - setSize(settings.bottom, 'y'), 0);
        } else if (settings.top !== false) {
            top += setSize(settings.top, 'y');
        } else {
            top += Math.round(Math.max($window.height() - size.height - interfaceHeight, 0) / 2);
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

        var callback, speed = settings.transition === "none" ? 0 : settings.speed;
        
        size = {
            minWidth: 0,
            minHeight: 0,
            width: false,
            height: false,
            maxWidth: false,
            maxHeight: false
        };

        if (settings.minWidth) {
            size.minWidth = setSize(settings.minWidth, 'x') - interfaceWidth;
        }

        if (settings.minHeight) {
            size.minHeight = setSize(settings.minHeight, 'y') - interfaceHeight;
        }

        size.maxHeight = size.height = settings.height ?
                setSize(settings.height, 'y') - interfaceHeight :
                settings.innerHeight && setSize(settings.innerHeight, 'y');
        
        size.maxWidth = size.width = settings.width ?
                setSize(settings.width, 'x') - interfaceWidth :
                settings.innerWidth && setSize(settings.innerWidth, 'x');
        
        // Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
        // If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.
        if (settings.maxWidth) {
            size.maxWidth = setSize(settings.maxWidth, 'x') - interfaceWidth;
            size.maxWidth = size.width && size.width < size.maxWidth ? size.width : size.maxWidth;
        }

        if (settings.maxHeight) {
            size.maxHeight = setSize(settings.maxHeight, 'y') - interfaceHeight;
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
            .css({width: getWidth(), overflow: settings.scrolling ? 'auto' : 'hidden'})
            .css({height: getHeight()})// sets the height independently from the width in case the new width influences the value of height.
            .css({visibility:''})
            .addClass('cbox-is-loading')
            .prependTo($body);

        $content.css({width: '100%', height: '100%'});

        $('.cbox-photo').css({width:'', height:''});

        callback = function () {
            var total = $.colorbox.group.length,
                complete;
            
            if (!open) {
                return;
            }
            
            complete = function () {

                clearTimeout(loadingTimer);

                $content.removeClass('cbox-is-loading');

                trigger(event_complete, settings.onComplete);
            };
            
            $title.html(settings.title).show();
            $content.show();
            
            if (total > 1) { // handle grouping
                if (typeof settings.current === "string") {
                    $current.html(settings.current.replace('{current}', $.colorbox.index + 1).replace('{total}', total)).show();
                }

                $next[(settings.loop || $.colorbox.index < total - 1) ? "show" : "hide"]().html(settings.next);
                $prev[(settings.loop || $.colorbox.index) ? "show" : "hide"]().html(settings.previous);
                
                // Preloads images within a rel group
                if (settings.preloading) {
                    $.each([getIndex(-1), getIndex(1)], function(){
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

                        if (src && (isImage(src) || data.photo)) {
                            img = new Image();
                            img.src = src;
                        }
                    });
                }
            } else {
                $next.hide();
                $prev.hide();
            }
            
            if (settings.iframe) {
                var iframe = $('<iframe class="cbox-iframe"/>')[0];
                
                if ('frameBorder' in iframe) {
                    iframe.frameBorder = 0;
                }
                
                if ('allowTransparency' in iframe) {
                    iframe.allowTransparency = "true";
                }

                if (!settings.scrolling) {
                    iframe.scrolling = "no";
                }
                
                $(iframe)
                    .attr({
                        src: settings.href,
                        name: (new Date()).getTime(), // give the iframe a unique name to prevent caching
                        allowFullScreen : true, // allow HTML5 video to go fullscreen
                        webkitAllowFullScreen : true,
                        mozallowfullscreen : true
                    })
                    .one('load', complete)
                    .appendTo($content);
                
                $events.one(event_purge, function () {
                    iframe.src = "//about:blank";
                });

                if (settings.fastIframe) {
                    $(iframe).trigger('load');
                }
            } else {
                complete();
            }
        };

        $.colorbox.position(speed, callback);
    }

    function load () {
        var href,
            $inline;

        active = true;

        $events.trigger('removeClass');
        if (settings.className) {
            var className = settings.className;
            $root.addClass(settings.className);
            $events.one('removeClass closed', function(){
                $root.removeClass(className);
            });
        }
        
        trigger(event_purge);
        
        trigger(event_load, settings.onLoad);
        
        href = settings.href;
        
        // short delay before showing loading state
        // loadingTimer = setTimeout(function () {
        //     $content.addClass('cbox-is-loading');
        // }, 100);

        if (settings.inline) {
            // Inserts an empty placeholder where inline content is being pulled from.
            // An event is bound to put inline content back when ColorBox closes or loads new content.
            $inline = $('<div/>').hide().insertBefore($(href)[0]);

            $events.one(event_purge, function () {
                $inline.replaceWith($content.children());
            });

            prep($(href));
        } else if (settings.iframe) {
            // IFrame element won't be added to the DOM until it is ready to be displayed,
            // to avoid problems with DOM-ready JS that might be trying to run in that iframe.
            prep(" ");
        } else if (settings.html) {
            prep(settings.html);
        } else if (isImage(href)) {
            var photo = new Image(),
                setResize;

            $(photo)
            .on('error',function () {
                settings.title = false;
                prep($('<div class="cbox-error"/>').html(settings.imgError));
            })
            .one('load', function () {
                var percent;

                if (settings.retinaImage && window.devicePixelRatio > 1) {
                    photo.height = photo.height / window.devicePixelRatio;
                    photo.width = photo.width / window.devicePixelRatio;
                }

                if (settings.scalePhotos) {
                    setResize = function () {
                        photo.height -= photo.height * percent;
                        photo.width -= photo.width * percent;
                    };
                    if (settings.mw && photo.width > settings.mw) {
                        percent = (photo.width - settings.mw) / photo.width;
                        setResize();
                    }
                    if (settings.mh && photo.height > settings.mh) {
                        percent = (photo.height - settings.mh) / photo.height;
                        setResize();
                    }
                }
                
                photo.style.marginTop = -photo.height/2 + 'px';
                photo.style.marginLeft = -photo.width/2 + 'px';
                if ($.colorbox.group[1] && (settings.loop || $.colorbox.group[$.colorbox.index + 1])) {
                    photo.style.cursor = 'pointer';
                    photo.onclick = $.colorbox.next;
                }

                prep($('<div class="cbox-photo"/>').css({width:photo.width, height:photo.height}).append(photo));
            });

            photo.src = retinaUrl(href);

        } else if (href) {
            prep(status === 'error' ? $('<div class="cbox-error"/>').html(settings.xhrError) : $(this).contents());
        }
    }
    
    $.colorbox.index = null;

    $.colorbox.group = null;

    // Navigates to the next page/image in a set.
    $.colorbox.next = function () {
        if (!active && $.colorbox.group[1] && (settings.loop || $.colorbox.group[$.colorbox.index + 1])) {
            $.colorbox.index = getIndex(1);
            launch($.colorbox.group[$.colorbox.index]);
        }
    };
    
    $.colorbox.prev = function () {
        if (!active && $.colorbox.group[1] && (settings.loop || $.colorbox.index)) {
            $.colorbox.index = getIndex(-1);
            launch($.colorbox.group[$.colorbox.index]);
        }
    };

    // Note: to use this within an iframe use the following format: parent.$.fn.colorbox.close();
    $.colorbox.close = function () {
        if (open && !closing) {
            
            closing = true;
            
            open = false;
            
            $(document).unbind('.cbox');
            $(window).unbind('.cbox');

            trigger(event_cleanup, settings.onCleanup);
                        
            $root.fadeTo(200, 0);
            
            $body.stop().fadeTo(300, 0, function () {
            
                $body.add($root).css({'opacity': 1, cursor: 'auto'}).hide();

                $(document.body).removeClass('js-cbox');
                
                trigger(event_purge);
                
                $content.empty();
                
                setTimeout(function () {
                    closing = false;
                    trigger(event_closed, settings.onClosed);
                }, 1);
            });
        }
    };

    // Removes changes ColorBox made to the document, but does not remove the plugin
    // from jQuery.
    $.colorbox.remove = function () {

    };

    // A method for fetching the current element ColorBox is referencing.
    // returns a jQuery object.
    $.colorbox.element = function () {
        return $(element);
    };

    $.colorbox.on = function () {
        $.fn.on.apply($events, arguments);
    };


    $.colorbox.off = function() {
        $.fn.off.apply($events, arguments);
    };

    $.colorbox.settings = defaults;

}(jQuery, document, window));
