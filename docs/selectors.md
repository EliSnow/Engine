#Selectors

*	[Important note about CSS Level 4 Selectors](#css4)
* 	[:any-link](#any-link)
* 	[:contains](#contains)
* 	[:has](#has)
* 	[:local-link](#local-link)
* 	[:matches](#matches)
* 	[:not](#not)
* 	[:nth-match, :nth-last-match](#nth-match)
* 	[:referenced-by](#referenced-by)
* 	[:scope](#scope)
* 	[:{0} (ad-hoc pseudo)](#ad-hoc)
* 	[[attribute]/[.property]](#attr-prop)

<a id="css4"></a>
##Important note about CSS Level 4 Selectors

Engine implements many selectors which are currently not natively supported by
`document.querySelectorAll`. When given a selector, Engine will first try to get
`document.querySelectorAll` to handle the selector, if that fails Engine will
translate the selector into something that `document.querySelectorAll` supports.
As browsers start experimenting with CSS Level 4 selectors, there is the
_potential_ that browsers' implementations will cause Engine's translation to be
bypassed returning unexpected results.

Not only is this a _potential_ issue but it has already happened. Recently,
Chrome v22 was released with a broken implementation of `:scope`. This bypassed
Engine's implementation and caused some of the tests to fail. While the bug was
[known and patched](https://groups.google.com/a/chromium.org/forum/?fromgroups=#!topic/chromium-bugs/vcfGk5av1N0)
by Chromium developers, that patch did not make it in to Chrome v22 before
deployement.

To mitigate the risk of similar bugs affecting users code, selectors can be
prepended with `--` (double hyphen) to force Engine to translate. Sub-selectors
should also be prepended with `--` to force Engine to translate.

Example:  
```js
engine("--:local-link");  
//sub-selector also needs translating  
engine("-- :nth-match(odd of --:scope > p)", document.body);
```

It is important to note that the
[CSS Level 4 Selector Specification](http://dev.w3.org/csswg/selectors4/) is in
draft form, and therefore **will** change. Whether those changes will impact
specific selectors which Engine implements is unknown. The developers of Engine
will strive to keep CSS Level 4 selectors compliant with the specification. If a
change to a selector is needed (CSS Level 4 or otherwise), that change will be
rolled into the next major version--so be sure to read the release notes.

<a id="any-link"></a>
##:any-link

###Description
The any-link pseudo selector selects elements which are referenced by an anchor
element.

###Examples
**Example 1**  
Select an element with an id of "foo" that has an anchor referencing it:  
```js
engine("#foo:any-link");
```

###Standards

*	[CSS Level 4 Selectors](http://dev.w3.org/csswg/selectors4/#any-link-pseudo)

<a id="contains"></a>
##:contains

###Description
The contains pseudo selector selects elements based upon the text within the
element.

`:contains` uses the `element.textContent` property and thus can see text
which is not visible in a page such as elements which are hidden or set to 
`display : none` or even text within Javascript tags. `:contains` is actually
a shortcut for `[.textContent*=[contains args here]]` and therefore
supports regular expressions, flags and references. See the
[attribute/property selector](#attr-prop) for more details.

###Examples
**Example 1**  
Select elements which case-insensitively contain the text "copyright":  
```js
engine(":contains(copyright i)");
```

**Example 2**  
Select elements which contain text which matches the given regular expression:  
```js 
engine(":contains('gr[ea]y' r)");
```

**Example 3**  
Select elements which contains the text in the reference:  
```js 
engine(":contains({0})", ["login"]);
```

###Standards

*	Engine extension

<a id="has"></a>
##:has

###Description
The has pseudo selector takes a sub-selector and executes that sub-selector in
the context of candidate elements. If the sub-selector results in at least one
matching element, the candidate element is selected.

###Examples
**Example 1**  
Select elements which have a child with a class of ".comment":  
```js
engine(":has(> .comment)");
```

**Example 2**  
Select elements which have a preceding sibling with an id of "notice":  
```js
engine(":has(~ #notice)");
```

###Standards

*	Engine extension

<a id="local-link"></a>
##:local-link

###Description
The local-link pseudo selector selects anchor elements whose URI points to a
local path in relation to the current document. `:local-link` can be used with
no arguments or a non-negative integer as an argument.

When `:local-link` is used with no arguments, then anchors which point to the
current document will be selected. Every part of the URI except fragment
identifiers must match.

When `:local-link` is provided a non-negative integer it will compare the domain
and path parts of the URI to the current document. The path is broken into
into sections separated by forward slashes `/`. For example, if the current
document's URI were "https://github.com/EliSnow/Engine/blob/master/engine.js"
a `0` argument includes just the domain "github.com", a `1` argument includes
the domain and first section of the path "github.com/EliSnow", a `2` argument
includes the domain and first two parts of the path "github.com/EliSnow/Engine/"
and so forth. If the non-negative integer exceeds the number of matching parts
in the current document's URI, no element will be selected.

###Examples
All of the examples assume a document URI of
"https://github.com/EliSnow/Engine/blob/gh-pages/README.md".

**Example 1**  
Select all anchor elements which point to the current document:  
```js
engine(":local-link");
```

**Example 2**  
Select all anchor elements whose URI contains the parts 
"github.com/EliSnow/Engine/blob/gh-pages":  
```js
engine(":local-link(4)");
```

**Example 3**  
Selects no elements because `6` exceeds the number of matching parts in the
document's URI:  
```js
engine(":local-link(6)");
```

###Standards 

*	[CSS Level 4 Selectors](http://dev.w3.org/csswg/selectors4/#local-pseudo)

<a id="matches"></a>
##:matches

###Description
The matches pseudo selector selects elements which meet the sub-selector. This
can be especially helpful in simplifying complex selectors. For example:  
`div > p:nth-child(2n+1), div > a:nth-child(2n+1), div > h1:nth-child(2n+1)`  
Can be simplified:  
`div > :matches(p, a, h1):nth-child(2n+1)`.  

###Examples
**Example 1**  
Select child elements of body which are headings:  
```js
engine("body > :matches(h1, h2, h3, h4, h5, h6)");
```

###Standards

*	[CSS Level 4 Selectors](http://dev.w3.org/csswg/selectors4/#matches)

<a id="not"></a>
##:not

##Description
The not pseudo selector does the opposite of the
[matches pseudo selector](#matches), selecting elements which do not match the
given sub-selector.

The difference between the
[CSS Level 3 version](http://www.w3.org/TR/css3-selectors/#negation) of `:not`
is the CSS Level 4 version allows complex selectors.

###Examples
**Example 1**  
Select input elements which are not checked and do not have the class ".hidden":  
```js
engine("input:not(:checked, .hidden)");
```

###Standards

*	[CSS Level 3 Selectors](http://www.w3.org/TR/selectors/#negation)
*	[CSS Level 4 Selectors](http://dev.w3.org/csswg/selectors4/#negation)

<a id="nth-match"></a>
##:nth-match, :nth-last-match

###Descriptions
The nth-match and nth-last-match selectors work similar to the match and
nth-child/nth-last-child pseudo selectors by selecting the nth element which
matches the sub-selector. The grammar for the argument works by specifying an
anb value followed by whitespace, the word "of", whitespace and a sub-selector. 

###Examples
**Example 1**  
Select the odd elements which match the selector "div > code.js":  
```js
engine(":nth-match(odd of div > code.js)");
```

**Example 2**  
Select the "4n-2" last elements which match the selector "footer :any-link":  
```js
engine(":nth-last-match(4n-2 of footer :any-link)");
```

###Standards

*	[CSS Level 4 Selectors](http://dev.w3.org/csswg/selectors4/#nth-match-pseudo)

<a id="referenced-by"></a>
##:referenced-by

###Description
The referenced-by pseudo selector selects elements whose id is referenced by an
attribute or property in some element. The grammar for the argument works by
specifying an attribute/property name, whitespace, "in", whitespace and the
sub-selector. The "in" keyword and the sub-selector can be omitted to imply a
sub-selector of `*`.

###Examples
**Example 1**  
Select all elements whose id is referenced by the "for" attribute on any
element:  
```js
engine(":referenced-by(for)");
```

**Example 2**  
Select all elements whose id is referenced by the "data-link" attribute on any
"code" element:  
```js
engine(":referenced-by(data-link in code)");
```

**Example 3**  
Select all elements whose id is referenced by the "htmlFor" property on any
element which matches "form > label":  
```js
engine(":referenced-by(.htmlFor in form > label)");
```

###Standards

*	Engine extension

<a id="scope"></a>
##:scope

###Description
The scope pseudo selector matches the context element that was passed into
`engine` or `engine.translate`. When no context element is provided, scope is
the equivalent of `:root`.

Note: Using `:scope`, like `:root`, is only useful in sub-selectors.

###Examples
**Example 1**  
Select even div elements that are descendants of the provided context element:  
```js
engine(":nth-match(even of :scope div)", document.getElementsByTagName("footer")[0]);
```

###Standards

*	[CSS Level 4 Selectors](http://dev.w3.org/csswg/selectors4/#scope-pseudo)

<a id="ad-hoc"></a>
##:{0} (ad-hoc pseudo)

###Description
Ad-hoc pseudo selectors utilize functions within the
[references object](#engine) which was passed to `engine` or `engine.translate`.
Ad-hoc functions are essentially [filter functions](api.md#add-filter).

###Examples
**Example 1**  
An ad-hoc pseudo selector which selects element that have a text node as their
next sibling:  
```js
engine(":{textNextSibling}", {  
	textNextSibling : function () {  
		return this.nextSibling.nodeType == 3;  
	}  
});
```

**Example 2**  
An ad-hoc selector with arguments:  
```js
engine(":{0}(foobar)", [  
	function (args) {  
		//do stuff  
	}
]);
```

###Standards

*	Engine extension

<a id="attr-prop"></a>
##[attribute]/[.property]

###Description
Selects elements based on an attribute or property.

There are four important parts of an attribute/property selector:
_attribute/property name_, _comparator_, _value_, and _flags_.

**Attribute/Property Name**  
For any attribute name, simply provide the name of the attribute. For example
"class". To select a property name, prepend a period to the name of the
property. For example ".offsetTop".

**Comparator**  
There are seven comparators which can be used. They are:

* 	`=`  
	Checks that the attribute/property is strictly equal to the given value.  
* 	`~=`  
	Checks that the attribute/property, which is a whitespace-separated
	list of values, contains the given value.  
* 	`^=`  
	Checks that the attribute/property starts with the given value.  
* 	`$=`  
	Checks that the attribute/property ends with the given value.  
* 	`*=`  
	Checks that the attribute/property contains the given value.  
* 	`|=`  
	Checks that the attribute/property, which is a hyphen-separated
	list of values, begins with the given value.  
* 	`!=`  
	Checks that the attribute/property is not strictly equal to the given value.  

In addition to the seven comparators, the attribute/property selector can check
whether a given attribute/property exists on an element by excluding the
comparator, value and flags parts. For example `[id]`.

By default all of the comparators perform a string comparison, but the `=` and
`!=` comparators can be used with a reference to do comparisons on any object
type.

**Value**  
A value can be any string value, though some special characters will require the
value be surrounded in quotes. Value can be a regular expression, which requires
the use of the `r` flag.

A value can also be a reference to a key in the
[reference object](api.md#engine). If the reference points to a `RegExp` object,
any specified flags will be ignored. `RegExp` references work with the `=`, `*=`
and `!=` comparators (`=` and `*=` will yield the same results).

**Flags**  
Flags are a series of unspaced letters. The order is not important. There are
two main flags `r` and `i`. `r` signifies that the value part is a regular
expression. `i` signifies that comparisons should be case-insensitive.

When the `r` flag is used, any additional flags are used in instantiating the
`RegExp` object--which means other `RegExp` supported flags such as `m` can also
be used. The `r` flag is only recognized in conjunction with the `=`, `*=` and
`!=` comparators. With the `r` flag the `=` and `*=` comparators are equivalent.

###Examples
**Example 1**  
Select elements where the "id" attribute case-insensitively equals "footer":  
```js
engine("[id=footer i]");
```

**Example 2**  
Select elements where the whitespace-seperated "class" attribute contains a
value of "italics":  
```js
engine("[class~=italics]");
```

**Example 3**  
Select elements where the "href" attribute starts with "https":  
```js
engine("[href^=https]");
```

**Example 4**  
Select elements where the "id" attribute does not equal "footer":  
```js
engine("[id!=footer]");
```

**Example 5**  
Select elements where the "className" property ends with "bold":  
```js
engine("[.className$=bold]");
```

**Example 6**  
Select elements where the "class" attribute contains "underline":  
```js
engine("[class*=underline]");
```

**Example 7**  
Select elements where the hyphen-seperated attribute "lang" starts with "en":  
```js
engine("[lang|=en]");
```

**Example 8**  
Select elements where the attribute "id" matches the case-insensitive regular
expression "^head\\w*":  
```js
engine("[id='^head\\w*' ri]");
```

**Example 9**  
Select elements where the attribute "id" does not match the referenced `RegExp`
`/^head\w*/i`:  
```js
engine("[id!={0}]", [/^head\w*/i]);
```

**Example 10**  
Select elements where the property "offsetLeft" is equal to the referenced value
`100`:  
```js
engine("[.offsetLeft={n}]", { n : 100});
```

###Standards

*	Engine extension
*	[CSS2 Selectors](http://www.w3.org/TR/CSS2/selector.html#attribute-selectors)
*	[CSS Level 3 Selectors](http://www.w3.org/TR/selectors/#attribute-selectors)
*	[CSS Level 4 Selectors](http://dev.w3.org/csswg/selectors4/#attribute-case)
