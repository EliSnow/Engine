/*jshint strict:true, eqeqeq:false, eqnull:true, smarttabs:true, regexdash: true, immed:true, forin:true, noarg:true, nonew:true, laxbreak:true, undef:true, unused:true, curly:true, latedef:true, newcap:true, browser:true, maxerr:50, quotmark:true */
/*ie8_start*/
/*global Element:true */
/*ie8_end*/
var engine = (function () {
	"use strict";
	function regCombineOr () {
		return "(?:(?:" + [].join.call(arguments, ")|(?:") + "))";
	}

	//css patterns
	var nonascii = "[^\\x00-\\xFF]",
		escape = "\\\\" + regCombineOr("[\\da-fA-F]{1,6}(?:(?:\\r\\n)|\\s)?", "[^\\n\\r\\f\\da-fA-F]"),
		nmstart = regCombineOr("[_a-zA-Z]", nonascii, escape),
		nmchar = regCombineOr(nmstart, "[\\w-]"),
		ident = "-?" + nmstart + nmchar + "*",
		nl = "\\n|(?:\\r\\n)|\\f",
		string1 = "'(?:[^\\n\\r\\f\\\\']|(?:\\\\" + nl + ")|(?:" + escape + "))*'",
		string2 = string1.replace("'", "\""),
		string = regCombineOr(string1, string2),
		combinatorComma = "\\s*([+>~,\\s])\\s*",
		argReference = "{[^}]+}",
		stringIdentFlag = "(" + regCombineOr(ident, string, argReference) + ")(?:\\s+([a-zA-Z]*))?",
		attrib = "\\[\\s*(\\.?" + ident + ")\\s*(?:([|^$*~!]?=)\\s*" + stringIdentFlag + "\\s*)?\\]",
		pseudoClass = "[:.](" + regCombineOr(ident, argReference) + ")",
		hash = "#" + nmchar + "+",
		type = regCombineOr(ident, "\\*"),
		simpleSelectorPattern = new RegExp("^(" + regCombineOr(combinatorComma, type, hash, pseudoClass, attrib) + ")(.*)$"),
		anbPattern = /(?:([+-]?\d*)n([+-]\d+)?)|((?:[+-]?\d+)|(?:odd)|(?:even))/i,
		identReg = new RegExp("^" + ident + "$"),
		hashReg = new RegExp("^" + hash + "$"),
		typeReg = new RegExp("^" + type + "$"),
		classReg = new RegExp("^(?:\\." + ident + ")*$"),
		classReplaceReg = new RegExp("\\.(" + ident + ")", "g"),
		//end css patterns
		//filters that are lowercase are used internally and do not receive the same arguments as normal filters
		filters = {
			tru : function () {
				return 1;
			},
			/*attr_start*/
			attr : function (el, attr, comparator, value, flags, references) {
				flags = (flags || "").toLowerCase();
				value = value || "";
				var property = attr[0] == "."
						? attr.substr(1)
						: undefined,
					attrValue = property
						? el[property]
						: el.getAttribute(attr) || "",
					testValue = value[0] == "{"
						? references[value.slice(1, -1)]
						: value.replace(beginEndQuoteReplace, "$2"), //strip out beginning and ending quotes if present
					regProp = testValue + "-" + flags,
					reg = Object.prototype.toString.call(testValue) == "[object RegExp]"
						? testValue
						: flags.indexOf("r") > -1
							? (regExpCache[regProp] || (regExpCache[regProp] = new RegExp(testValue, flags.replace("r", ""))))
							: undefined;
				if (flags.indexOf("i") > -1 && !reg) {
					attrValue = attrValue.toUpperCase();
					testValue = testValue.toUpperCase();
				}
				switch (comparator) {
					case "=" :
						return reg
							? reg.test(attrValue)
							: attrValue === testValue;
					case "~=" :
						return (" " + attrValue.replace(spaceReplace, " ") + " ").indexOf(" " + testValue + " ") > -1;
					case "^=" :
						return !attrValue.indexOf(testValue); //== 0
					case "$=" :
						return attrValue.slice(-testValue.length) == testValue;
					case "*=" :
						return reg
							? reg.test(attrValue)
							: attrValue.indexOf(testValue) > -1;
					case "|=" :
						return attrValue == testValue || !attrValue.indexOf(testValue + "-"); //== 0
					case "!=" :
						return reg
							? !reg.test(attrValue)
							: attrValue !== testValue;
					default : 
						/*ie8_start*/
						//fixes IE8 querySelector bug with [attr]	
						if (!pseudoNotSupport && !property) {
							var node = el.getAttributeNode(attr);
							return node && node.specified;
						}
						/*ie8_end*/
						return property in el;
				}
			},
			/*contains_start*/
			CONTAINS : function (el, args, p, references) {
				args = args.match(containsArg);
				return filters.attr.apply(undefined, [el, ".textContent", "*=", args[1], args[2], references]);
			},
			/*contains_end*/
			/*attr_end*/
			/*has_start*/
			HAS : function (el, args, p, references) {
				return el.ownerDocument.querySelector(translate(args, el, references));
			},
			/*has_end*/			
			/*any-link_start*/
			"ANY-LINK" : function (el) {
				var id = el.id;
				if (id) {
					return el.ownerDocument.querySelector("a[href$='#" + id + "']");
				}
			}
			/*any-link_end*/
		},
		transformers = {
			/*local-link_start*/
			"LOCAL-LINK" : function (args, attr, attrValue, p, context) {
				var	pathnameParts, selector,
					contextDoc = context.ownerDocument || context,
					pathname = contextDoc.location.pathname;
				pathname = pathnameSlash
					? pathname
					: pathname.substr(1);
				if (!args) {
					selector = "a[.protocol='" + contextDoc.location.protocol + "'][.host='" + contextDoc.location.host + "'][.pathname='" + pathname + "']";
				} else {
					//convert the string to a number
					args -= pathnameSlash ? -1 : 0;
					pathnameParts = pathname.split("/");
					if (pathnameParts.length >= args) {
						pathname = pathnameParts.slice(0, args).join("/");
						selector = "a[.host='" + contextDoc.location.host + "'][.pathname^='" + pathname + "']";
					}
				}
				if (selector) {
					filter(engine(selector, contextDoc), attr, attrValue, filters.tru);
				}
			},
			/*local-link_end*/
			/*not_start*/
			NOT : function (args, attr, attrValue, p, context, references) {
				args = filter(engine(args, context, references), attr, attrValue, filters.tru);
				/*ie8_start*/
				if (!pseudoNotSupport) {
					return translate("[" + attr + "!='" + attrValue + "']", references);
				}
				/*ie8_end*/
				return ":not(" + args + ")";
			},
			/*not_end*/
			/*referenced-by_start*/
			"REFERENCED-BY" : function (args, attr, attrValue, p, context, references) {
				var element, refEl,
					match = args.match(referencedByArg),
					contextDoc = context.ownerDocument || context,
					referenceAttr = match[1],
					elements = engine(":matches(" + (match[2] || "*") + ")[" + referenceAttr + "]", contextDoc, references),
					l = elements.length;
				while ((element = elements[--l])) {
					refEl = contextDoc.getElementById(referenceAttr[0] == "." ? element[referenceAttr.substr(1)] : element.getAttribute(referenceAttr));
					if (refEl) {
						refEl.setAttribute(attr, attrValue);
					}
				}
			},
			/*referenced-by_end*/
			/*matches_start*/
			MATCHES : function (args, attr, attrValue, p, context, references) {
				filter(engine(args, context.ownerDocument || context, references), attr, attrValue, filters.tru);
			},
			/*matches_end*/
			/*scope_start*/
			SCOPE : function () {
				return scope;
			}
			/*scope_end*/
		},
		/*contains_start*/
		containsArg = new RegExp("^" + stringIdentFlag + "$"),
		/*contains_end*/
		/*referenced-by_start*/
		referencedByArg = /^\s*(\S+)(?:\s+in\s+([\s\S]*))?\s*$/i,
		/*referenced-by_end*/
		/*scope_start*/
		scope,
		/*scope_end*/
		spaceReplace = /\s+/g,
		escapeReplace = /\\./g,
		/*attr_start*/
		regExpCache = {},
		beginEndQuoteReplace = /^(['"])(.*)\1$/,
		/*attr_end*/
		attrBase = "data-e" + (+new Date()),
		//increments each time getSelector is called, used for the unique attribute value
		inique = 0,
		//increments every time translate is called (recursive calls do not increment it)
		nnique = 0,
		//reset every time translate is called (recursive calls do not reset it) and incremented
		//for attribute names
		tnique,
		runningCount = 0,
		slice = [].slice,
		/*local-link_start*/
		pathnameSlash = (function () {
			var a = document.createElement("a");
			a.href="/";
			return a.pathname;
		}()),
		/*local-link_end*/
		engine = function (selector, context, references) {
			var contextDoc,
				isDoc = isDocument(context);
			if (!(references || isDoc || isElement(context))) {
				references = context;
				context = document;
				isDoc = 1;
			}
			selector = selector.trim();
			if (isDoc && hashReg.test(selector)) {
				return [context.getElementById(selector.substr(1))];
			}
			if (typeReg.test(selector)) {
				return slice.call(context.getElementsByTagName(selector));
			}
			if (/*ie8_start*/ pseudoNotSupport && /*ie8_end*/classReg.test(selector)) {
				return slice.call(context.getElementsByClassName(selector.replace(classReplaceReg, " $1")));
			}
			try {
				contextDoc = context.ownerDocument || context;
				if ((selector.indexOf(",") < 0 || isDoc) /*ie8_start*/ && pseudoNotSupport /*ie8_end*/) {
					return slice.call(contextDoc.querySelectorAll(getSelector(context) + " " + selector));
				}
				throw 1;
			} catch (e) {
				return slice.call(contextDoc.querySelectorAll(translate(selector, context, references)));
			}
		},
		anb = engine.anb = function (str) {
			//remove all spaces and parse the string
			var match = str.replace(spaceReplace, "")
						   .match(anbPattern),
				a = match[1],
				n = !match[3],
				b = n 
					? match[2] || 0
					: match[3];
			if (b == "even") {
				a = 2;
				b = 0;
			} else if (b == "odd") {
				a = 2;
				b = 1;
			} else if (a == "+" || a == "-") {
				a += 1;
			} else if (!a && !n) {
				a = 0;
			} else if (!a) {
				a = 1;
			}
			//return an iterator
			return (function (a, b) {
				var y,
					posSlope = a >= 0,
					//if no slope or the y-intercept >= 0 with a positive slope start x at 0
					//otherwise start x at the x-intercept rounded
				    startX = !a || (b >= 0 && posSlope)
						? 0
						: posSlope
							? Math.ceil(-b / a)
							: Math.floor(-b / a),
					x = startX;
				return {
					next : function () {
						return x < 0 || (!a && y == b) 
							? -1 
							: (y = a * (posSlope ? x++ : x--) + b); //for positive slopes increment x, otherwise decrement
					},
					reset : function () {
						x = startX;
						y = undefined;
					},
					matches : function(y) {
						if (!a) {
							return y == b;
						}
						var x = (y - b) / a;
						//check that x is a whole number
						return x >= 0 && x == (x | 0);
					}
				};
			}(a - 0, b - 1)); //convert a and b to a number (if string), subtract 1 from y-intercept (b) for 0-based indices
		},
		translate = engine.translate = function (selector, context, references) {
			/*
			 * Capture groups:
			 * 1 - whole match
			 * 2 - combinator/comma
			 * 3 - class/pseudo
			 * 4 - attribute name
			 * 5 - attribute comparator
			 * 6 - attribute value
			 * 7 - attribute flags
			 * 8 - right context
			 */
			var cScope, group, str, n, j, k, match, args, pseudo, filterFn, contextDoc,
				wholeSelector = "",
				lastMatchCombinator = "*";
			if (!(references || isDocument(context) || isElement(context))) {
				references = context;
				context = document;
			}
			group = cScope = getSelector(context) + " ";
			contextDoc = context.ownerDocument || context;
			//if no other instances of engine are in progress
			if (!(runningCount++)) { //== 0
				tnique = 0;
				nnique++;
				scope = cScope;
			}
			selector = selector.replace(/^\s*--/, "");
			try {
				while ((match = selector.match(simpleSelectorPattern))) {
					selector = match[8] || "";
					if (match[2]) { //combinator or comma
						if (match[2] == ",") {
							wholeSelector = wholeSelector + group + ",";
							group = cScope;
						} else {
							group += match[2];
						}
						lastMatchCombinator = "*";
					} else {
						if (match[3] && match[0][0] == ":") { //pseudo
							pseudo = match[3];
							if (pseudo[0] == "{") {
								filterFn = references[pseudo.slice(1, -1)];
							} else {
								pseudo = pseudo.toUpperCase();
								filterFn = filters[pseudo];
							}
							//if there is an opening paren get everything in parens
							if (selector[0] == "(") {
								//locate the position of the closing paren
								selector = selector.substr(1).trim();
								//blank out any escaped characters
								str = selector.replace(escapeReplace, "  ");
								n = 1;
								//if the args start with a quote, search for the closing paren after the closing quote
								j = selector[0] == "\"" || selector[0] == "'"
									? selector.indexOf(selector[0], 1)
									: 0;
								while (n) {
									k = str.indexOf(")", ++j);
									j = str.indexOf("(", j);
									if (k > j && j > 0) {
										n++;
									} else {
										n--;
										j = k;
									}
								}
								if (j < 0) {
									break;
								}
								args = selector.substring(0, j).trim();
								selector = selector.substr(j + 1);
							}
							if (filterFn) {
								group = filter(contextDoc.querySelectorAll(group + lastMatchCombinator), attrBase + tnique++, nnique, filterFn, [ args, pseudo, references ]);
							} else if (transformers[pseudo]) {
								n = tnique++;
								group += transformers[pseudo].apply(null, [ args, attrBase + n, nnique, pseudo, context, references ]) || "[" + attrBase + n + "='" + nnique + "']";
							} else {
								group += match[1];
								if (args) {
									group += "(" + args + ")";
								}
							}
							args = 0;
						} else if (match[7] 
									|| (match[4] && match[4][0] == ".") 
									|| (match[6] && match[6][0] == "{") 
									/*ie8_start*/
									|| (!pseudoNotSupport
										&& ((!match[5] && match[4]) //IE8 [attr]
											|| match[5] == "!=")) //IE8 [attr!=foo]
									/*ie8_end*/
									) {
							group += filter(contextDoc.querySelectorAll(group + lastMatchCombinator), attrBase + tnique++, nnique, filters.attr, [ match[4], match[5], match[6], match[7], references ]);
						} else if (match[5] == "!=") {
							group += ":not([" + match[4] + "=" + match[6] + "])";
						} else {
							group += match[1];
						}
						lastMatchCombinator = "";
					}
				}
				return (wholeSelector + group + selector).trim();
			} finally {
				runningCount--;
			}
		},
		getSelector = engine.getSelector = function (el) {
			if (!el || isDocument(el)) {
				return "";
			}
			if (/*ie8_start*/pseudoNotSupport && /*ie8_end*/el == el.ownerDocument.documentElement) {
				return ":root";
			}
			if (el.id) {
				return "#" + el.id;
			}
			var attr = attrBase + "c",
				value = el.getAttribute(attr);
			if (!value) {
				value = inique++;
				el.setAttribute(attr, value);
			}
			return "[" + attr + "='" + value + "']";
		};

	/*nth-match_start*/
	transformers["NTH-MATCH"] = transformers["NTH-LAST-MATCH"] = function (args, attr, attrValue, pseudo, context, references) {
		var element,
			ofPos = args.indexOf("of"),
			anbIterator = anb(args.substring(0, ofPos)),
			elements = engine(args.substr(ofPos + 2), (context.ownerDocument || context), references),
			l = elements.length - 1,
			nthMatch = pseudo[4] != "L";
		while ((element = elements[nthMatch ? anbIterator.next() : l - anbIterator.next()])) {
			element.setAttribute(attr, attrValue);
		}
	};
	/*nth-match_end*/
	function filter (elements, attr, attrValue, filterFn, args) {
		args = args || [];
		for (var l = elements.length; l--;) {
			if (filterFn.apply(undefined, [elements[l]].concat(args))) {
				elements[l].setAttribute(attr, attrValue);
			}
		}
		//if all of the elements matched the filter return empty string
		return "[" + attr + "='" + attrValue + "']";
	}
	
	function isElement(o) {
		return o && o.nodeType == 1;
	}
	
	function isDocument(o) {
		return o && o.nodeType == 9;
	}
		
	function extend (pseudo, type, fn) {
		pseudo = pseudo.toUpperCase();
		//check that the pseudo matches the css pseudo pattern, is not already in use and that fn is a function
		if (identReg.test(pseudo) && !filters[pseudo] && !transformers[pseudo] && typeof(fn) == "function") {
			type[pseudo] = fn;
			return 1;
		}
		return 0;
	}

	engine.addFilter = function (pseudo, fn) {
		return extend(pseudo, filters, fn);
	};
	
	engine.addTransformer = function (pseudo, fn) {
		return extend(pseudo, transformers, fn);
	};
	
	/*ie8_start*/
	var pseudoNotSupport = 1;
	try {
		document.querySelector(":not(z)");
	} catch (e) {
		pseudoNotSupport = 0;
	}
		
	if (!pseudoNotSupport) {
		slice = function () {
			var array = [];
			array.push.apply(array, this);
			return array;
		};
		
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, "");
		};
		
		var htmlTagReplace = /<(?:[^>"']|(?:(['"])[\s\S]*?\1))*>/g,
			nextElementSibling = function (el) {
				var node = el;
				while ((node = node.nextSibling) && node.nodeType != 1){}
				return node;
			},		
			previousElementSibling = function (el) {
				var node = el;
				while ((node = node.previousSibling) && node.nodeType != 1){}
				return node;
			};
			
		Object.defineProperty(Element.prototype, "textContent", {
			get : function () {
				return this.innerHTML.replace(htmlTagReplace, "");
			},
			set : function (text) {
				this.innerHTML = document.createTextNode(text).data;
			}
		});
		/*ie8_empty_start*/
		filters.EMPTY = function (el) {
			for (var node = el.firstChild; node; node = node.nextSibling) {
				if (node.nodeType < 5) {
					return 0;
				}
			}
			return 1;
		};
		/*ie8_empty_end*/
		/*ie8_last-child_start*/
		filters["LAST-CHILD"] = function (el) {
			return !nextElementSibling(el);
		};
		/*ie8_last-child_end*/
		/*ie8_first-of-type_start*/
		filters["FIRST-OF-TYPE"] = filters["LAST-OF-TYPE"] = function (el, a, pseudo) {
			return filters["NTH-OF-TYPE"](el, "1", pseudo[0] == "F" ? "NTH-OF-TYPE" : "NTH-LAST-OF-TYPE");
		};
		/*ie8_first-of-type_end*/
		/*ie8_only-child_start*/
		filters["ONLY-CHILD"] = function (el) {
			return !nextElementSibling(el) && !previousElementSibling(el);
		};
		/*ie8_only-child_end*/
		/*ie8_only-of-type_start*/
		filters["ONLY-OF-TYPE"] = function (el, a, pseudo) {
			var tag = el.tagName,
				expando = pseudo + tag,
				parent = el.parentNode;
			if (parent[expando] != nnique) {
				parent[expando] = nnique;
				return engine(">" + tag, parent).length < 2;
			}
			return 0;
		};
		/*ie8_only-of-type_end*/
		/*ie8_nth-child_start*/
		filters["NTH-CHILD"] = filters["NTH-LAST-CHILD"] = filters["NTH-OF-TYPE"] = filters["NTH-LAST-OF-TYPE"] = function (el, args, pseudo) {
			var element, elements, l,
				parent = el.parentNode,
				anbIterator = anb(args),
				last = pseudo[4] == "L",
				type = pseudo.indexOf("O") > 0
					? el.tagName
					: "*",
				expando = pseudo + args + type;
			if (parent[expando + "p"] != nnique) {
				parent[expando + "p"] = nnique;
				elements = engine(
					">" + type, parent
				);
				l = elements.length - 1;
				while ((element = elements[last ? l - anbIterator.next() : anbIterator.next()])) {
					element[expando] = nnique;
				}
			}
			return el[expando] == nnique;
		};
		/*ie8_nth-child_end*/
		/*ie8_checked_start*/
		transformers.CHECKED = transformers.ENABLED = transformers.DISABLED = function (a, attr, attrValue, pseudo, context) {
			var selector = pseudo[0] == "C"
				? "input[.checked={0}],option[.selected={0}]"
				: ":matches(option,input,optgroup,button,select,textarea)[.disabled={0}]";
			filter(engine(selector, context, [pseudo[1] != "N"]), attr, attrValue, filters.tru);
		};
		/*ie8_checked_end*/
		/*ie8_target_start*/
		transformers.TARGET = function () {
			return location.hash;
		};
		/*ie8_target_end*/
		/*ie8_root_start*/
		filters.ROOT = function (el) {
			return el.ownerDocument.documentElement == el;
		};
		/*ie8_root_end*/
	}
	/*ie8_end*/
	return engine;
}());