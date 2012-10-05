#Engine
Engine is a powerful, lightweight utility for selecting document elements using
Javascript and CSS selectors.

[Read the docs](https://github.com/EliSnow/Engine/tree/master/docs/toc.md) for
more details.

##Change log
###Version 2
* 	CSS Level 4 Selectors!
	* 	:any-link
	* 	:local-link
	* 	:matches	
	* 	:not
	* 	:nth-match
	* 	:nth-last-match
	* 	[attr="VaLuE" i]
* 	Extension selectors
	* 	[attr!=value]
	* 	\[.prop=value] (property selector)
	* 	\[attr="^va.{2}e$" r] (regular expression)
	* 	\[attr={0}] (reference)
	* 	:{0} / :{wow} (ad hoc pseudo selectors)
	* 	:contains (ability to specify case-insensitivity/regexp)
	* 	:has
	* 	:referenced-by
* 	Complete code rewrite
	*	Depends on querySelector and querySelectorAll, meaning it runs in IE8+
		and other modern browsers
	* 	Dropped IE6-7 support
	* 	Dropped selector caching
	* 	The complete package weighs in at ~7KB minified (~3KB gzip)
	* 	More robust parser which closely follows the
		[W3 CSS selector grammar](http://www.w3.org/TR/css3-selectors/#w3cselgrammar)
* 	New API methods
	* 	engine.addFilter
	* 	engine.addTransformer
	* 	engine.anb
	* 	engine.getSelector
	* 	engine.translate
* 	grunt.js script which allows modular builds
	*	Devs can roll their own version without IE8 support or with only the
		selector support they need.
* 	Documentation
* 	Unit tests
* 	Modified MIT/X11 license