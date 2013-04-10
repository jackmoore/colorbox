## About Colorbox:
A customizable lightbox plugin for jQuery.  See the [project page](http://jacklmoore.com/colorbox/) for documentation and a demonstration, and the [FAQ](http://jacklmoore.com/colorbox/faq/) for solutions and examples to common issues.  Released under the [MIT license](http://www.opensource.org/licenses/mit-license.php).

## Colorbox 2.x vs 1.x

Internally, Colorbox 2.x is drastically different from 1.x.  However, the API is mostly the same as before.  A few options have been renamed or made obsolete, and IE7 support has been dropped. The most notable change is that Colorbox is no longer in the jQuery.fn namespace.

1.x way of assigning Colorbox:

	$('selector').colorbox(options);

2.x way of assigning Colorbox:

	$.colorbox('selector', options);

## Translations Welcome

Send me your language configuration files.  See /i18n/jquery.colorbox-de.js as an example.

## Notable changes:

* 'href' proprety is now called 'source' to better reflect it's multi-purpose role.
* 'rel' is now 'group' to reflect moving away from the rel property.  'group' value is a query selector, rather than an arbitrary string.
* 'photo', 'ajax', 'inline', 'iframe', 'html' properties have been replaced with a 'type' property.
* onCleanup has been removed
* onUnload has been added
* events have been renamed 'cbox_eventName' to 'cbox.eventName' for easier global unbinding with jQuery.

## Changelog:

Still in alpha, still much to do.