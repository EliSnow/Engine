#API

* 	[engine(selector \[, context \[, references \] \])](#engine)
* 	[engine.addFilter(pseudo, fn), engine.addTransformer(pseudo, fn)](#add-filter)
* 	[engine.anb(str)](#anb)
* 	[engine.getSelector(el)](#get-selector)
* 	[engine.translate(selector \[, context \[, references \] \])](#translate)

<a id="engine"></a>
<h2>engine(selector [, context = document [, references ] ] )<br>
engine(selector [, references ] )</h2>

###Description
`engine` behaves similar to `document.querySelectorAll`, selecting elements
based on a CSS selector. `engine` returns an array of elements which match the
given CSS selector.

###Parameters
**selector**  
A string value of the CSS selector used to select elements. Selectors may begin
with a combinator.

**context**  
An element which limits the scope of which elements will be selected. If not
specified, context defaults to `document`.

**references**  
References allow the user to create
[ad-hoc pseudo selectors](selectors.md#ad-hoc) which behave as
[filters](#add-filter). Additionally, some selectors can utilize references to
make element selection even more powerful
([attribute/property selectors](selectors.md#attr-prop),
[contains](selectors.md#contains)).

References are defined within an object or an array, and elements within are
referenced by their associated key. Keys can be any number of character but
cannot contain a closing curly brace `}`.

###Examples
**Example 1**  
Basic selector--select all divs that are children of a footer:  
```js
engine("footer > div");
```

**Example 2**  
Selector with context--select all elements with a class of "bold" which are
descendents of an element with an id of "demo"  
```js
engine(".bold", document.getElementById("demo"));
```

**Example 3**  
Selector that starts with a combinator and context--select all elements with a
class of "bold" that are children of an element with an id of "demo":  
```js 
engine("> .bold", document.getElementById("demo"));
```

**Example 4**  
Selector which uses a reference--select all elements which contain the text "foo
bar":  
```js 
engine(":contains({0})", ["foo bar"]);
```

**Example 5**  
Another selector which uses a reference--select all elements which contain the
text "bar"  :  
```js
engine(":contains({foo})", {foo : "bar"});
```

**Example 6**  
Selector which uses an ad-hoc pseudo selector--select all elements which do not
have an id:  
```js
engine(":{foo}", {foo : function () {  
	return !this.id;  
}});
```

<a id="add-filter"></a>
<h2>engine.addFilter(pseudo, fn)<br>
engine.addTransformer(pseudo, fn)</h2>

###Description
Both methods extend Engine's capabilities by adding new, custom pseudo selector
support. The methods will returns 1 if the new pseudo selector was added
successfully, 0 if not. A pseudo selector will not be added if `pseudo` does not
match CSS grammar for a pseudo name, if a custom pseudo selector already exists
by that name, or if `fn` is not a function.

The difference between `engine.addFilter` and `engine.addTransformer` is the
way by which they select elements.

A filter function is called for each element which is a candidate to be
selected. If the element matches the filter, the filter function returns a
truthy value, otherwise a falsey value.

A transformer function, by contrast, is called only once per occurrance in a
selector and it returns a replacement selector which is natively recognized by
`document.querySelectorAll`. In other words it _transforms_ a non-supported
selector in to a supported one.

###Parameters
**pseudo**  
A string representing the name of the new pseudo selector. Pseudo names are case
insensitive and cannot override a previously defined custom pseudo selector.

**fn**  
A function that is called as a filter or transformer.

Filter functions receive four arguments when called:

* 	_el_  
	The current element being evaluated.
*	_args_  
	A string value of the arguments used with a pseudo selector. For example,
	in the pseudo selector `:not(.class > a)` args would be ".class > a".
* 	_pseudo_  
	A string value of the pseudo name for the current pseudo selector being
	evaluated. This is useful when multiple custom pseudo selectors utilize
	the same function. Note that this value will be in uppercase.
* 	_references_  
	An array or object containing references which were passed in to either
	`engine` or `engine.translate`.

Transformer functions receive six arguments when called:

*	_args_  
	See _args_ above.
*	_attributeName_  
	A string value for a recommended attribute name to be used in conjunction
	with _attributeValue_. Because a transformer takes an unsupported pseudo
	selector and transforms it into a supported selector, the transformer
	function can optionally set this attribute name with the accompanied
	attribute value on matching elements, and then return an attribute selector.
*	_attributeValue_  
	A string value for a recommended attribute value to be used in conjunction
	with _attributeName_. See _attributeName_.
* 	_pseudo_  
	See _pseudo_ above.
*	_context_  
	The context element which was passed in to `engine` or `engine.translate`.
* 	_references_  
	See _references_ above.

Transformer functions should only return a simple selector--meaning the selector
contains no combinators. The return can be omitted from a transformer in which
case it will default to `[{attributeName}={attributeValue}]`.

###Examples
**Example 1**  
Add a filter to select elements which have an id:  
```js
//add the filter  
engine.addFilter("has-id", function (el) {  
	return el.id;  
});  
//utilize the new pseudo selector  
engine(":has-id");
```

**Example 2**  
Add a transformer to select elements which have an id (this will perform better
than the filter in example 1):  
```js
//add the transformer
engine.addTransformer("has-id", function () {  
	return "[id]";  
});  
//utilize the new pseudo selector    
engine(":has-id");
```

**Example 3**  
Add two transformers which use the same function:  
```js
//this is the actual transformer function used for ":nth-match" and
//":nth-last-match" (slightly refactored)  
var nthMatchLastMatch = function (args, attributeName, attributeValue, pseudo, context, references) {  
	var element,
		ofPos = args.indexOf("of"),
		anbIterator = anb(args.substring(0, ofPos)),
		elements = engine(args.substr(ofPos + 2), (context.ownerDocument || context), references),
		l = elements.length - 1,
		nthMatch = pseudo[4] != "L";
	while ((element = elements[nthMatch ? anbIterator.next() : l - anbIterator.next()])) {  
		element.setAttribute(attributeName, attributeValue);  
	}
};
//add the transformer functions  
engine.addTransformer("nth-match", nthMatchLastMatch);  
engine.addTransformer("nth-last-match", nthMatchLastMatch);  
//utilize the new pseudo selector  
engine(":nth-match(-2n+8 of span.italic)");
```

<a id="anb"></a>
##engine.anb(str)

###Description
`engine.anb` is a utility method to assist dealing with `an + b` expressions.
It returns an object with three methods:

* 	`next()`  
	Acts like an iterator returning an integer representing `y` in the equation
	`y = an + b`. On the first call, `next` will return the smallest whole
	number which matches the provided `an + b` expression. On subsequent
	calls, the next matching whole number is returned. If there are no remaining
	whole numbers, a negative integer is returned.
* 	`reset()`  
	Resets the object so subsequent calls to `next()` will be as if it had
	never previously been called.
* 	`matches(y)`  
	`matches` returns a boolean value indicating whether the the provided `y`
	value is found on the line mapped by the expression `an + b`.

**Note**: The CSS specification uses 1-based numbering in counting elements.
Because these utilities are meant to be used in conjunction with arrays and
array-like-objects which use 0-based numbering, the object returned by
`engine.anb` and its methods compensate by decrementing `b` by one.

###Parameters
**str**  
A string value with a
[CSS valid value](http://www.w3.org/TR/css3-selectors/#nth-child-pseudo) for
`an + b`.

###Examples
**Example 1**  
`next` and `reset`:  
```js
var iterator = engine.anb("odd");  
//"0 2 4"  
console.log(iterator.next(), iterator.next(), iterator.next());  
iterator.reset();  
//"0 2 4"  
console.log(iterator.next(), iterator.next(), iterator.next());
```

**Example 2**  
`matches`:  
```js
var matcher = engine.anb("3n+1");  
//false  
console.log(matcher.matches(2));  
//true  
console.log(matcher.matches(6));  
```

<a id="get-selector"></a>
##engine.getSelector(el)

###Description
`engine.getSelector` takes an element and returns a string value for a simple
CSS selector which uniquely identifies a that element.

##Parameters
**el**  
An element for which to get a CSS selector.

###Examples
**Example 1**  
Given the following HTML element:  
```html
<h1 id="header">This is a header</h1>
```

Get a selector for the above element:  
```js
var el = document.getElementById("header");  
//"#header"  
console.log(engine.getSelector(el));
```

**Example 2**  
Given the following HTML element:  
```html
<h1>This is a header</h1>
```

Get a selector for the above element:  
```js
//assuming the above h1 was the second h1 in the document  
var el = document.getElementsByTagName("h1")[1];  
//something like "[data-e1349511387861c='84']"  
console.log(engine.getSelector(el));
```

**Example 3**  
Given the following HTML element:  
```html
<html>
...
</html>
```

Get a selector for the above element:  
```js
var el = document.documentElement;  
//":root" if supported, otherwise something like "[data-e1349511387861c='16']"  
console.log(engine.getSelector(el));
```

<a id="translate"></a>
<h2>engine.translate(selector [, context = document [, references ] ] )<br>
engine.translate(selector [, references ] )</h2>

###Description
This method is used similarly to `engine`, the difference is rather than
returning an array of elements, a string is returned with a CSS selector that is
compatible with `document.querySelectorAll`.

**Important** - Due to the way Engine works, calling `engine` or
`engine.translate` may invalidate previously translated selectors.

###Parameters
See [engine](#engine) for details on the parameters.

###Examples
**Example 1**  
Translate an engine selector to a `document.querySelectorAll` compatible
selector:  
```js
//":not([class=bold])" if supported, otherwise something like  
//"[data-e1349511387861c='84']"  
console.log(engine.translate("[class!=bold]"));
```