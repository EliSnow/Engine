/*
 * Engine 1.0 beta 20110404
 * Written by Eli Snow 3lis.com
 *
 * This code is released as public domain meaning you may copy, sell, plagiarize,
 * print, distribute, burn, modify, eat, or otherwise do with this code as you like.
 *
 * Free source!
 */
var engine;
(function (document, undefined) {
    "use strict";
    engine = function (selector) {
        var tag, id, combinator, groups, test, match, i, lc, candidates,
        c = "",
        cReg = "",
        count = 0,
        fnA = [],
        saved = [];
        if (engine.cache[selector]) { //check cache for entire selector
            return engine.cache[selector];
        }
        try {
            return engine.cache[selector] = engine.nodeListToArray(document.querySelectorAll(selector)); //cache entire selector
        } catch(e) {
            //TODO: tweak regexp below so it doesn't capture commas in parenthesis or brackets
            groups = selector.split(/ ?, ?/g); //split the selector at every comma
            i = groups.length;
            while (i--) {
                if (engine.cache[(test = groups[i])]) { //check cache for this selector group
                    saved = saved.concat(engine.cache[groups[i]]);
                    continue
                }
                /*
                 * Loop below analyzes the current group of the selector for matches
                 * in the cache
                 *
                 * For example, if the selector were "div span > p #id"
                 * We already know the entire selector isn't in the cache (that was
                 * checked in the above if statement)so the loop below will look for
                 * "div span > p" then if there's no match "div span" and finally "div"
                 */
                //tweak regexp below so it doesn't capture spaces + ~ > in parenthesis or brackets
                while ((match = test.match(/(.*?) ?[+~>]? ?\S+$/))) {
                    if ((candidates = engine.cache[(lc = match[1])])) { //check cache for pieces of this selector
                        groups[i] = groups[i].replace(lc += " ", "");
                        break;
                    }
                    test = lc;
                }
                if (!candidates) { //If the above loop didn't find any matches in cache
                    lc = "";
                    candidates = [document];
                }
                groups[i].replace(/([a-zA-Z][a-zA-Z0-9]*|\*)|(?:#([a-zA-Z](?:[a-zA-Z0-9-_]|\\[:.])*))|(?:\.([a-zA-Z-_][a-zA-Z0-9-_]*))|(?::([^ :[(]+)(?:\(([^)]*)\))?)|(?:\[(?:([^ =\]]+?))(?:([~!^$*|]?=)['"]?([^\]]+)['"]?)?])| ?([~>+ ]) ?/g, function (m, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
                    /*
                     * The regexp captures as follows:
                     * Simple Selectors
                     * tag#id.class
                     *
                     * $1 - "tag"
                     * $2 - "id"
                     * $3 - "class"
                     *
                     * Psuedo Selectors
                     * :whatever(stuff)
                     *
                     * $4 - "whatever"
                     * $5 - "stuff"
                     *
                     * Attribute Selectors
                     * [attribute=something]
                     *
                     * $6 - "attribute"
                     * $7 - "="
                     * $8 - "something"
                     *
                     * $9 - combinators and spaces - + ~ >
                     */
                    lc += m;
                    var key;
                    if ($1) {
                        tag = $1;
                    } else if ($2) {
                        id = $2.replace(/\\/, ""); //get rid of any escape backslashes from the id "#some\\.id\\:name" --> "#some.id:name"
                    } else if ($3) {
                        cReg += ".*(?="; //used later on to check against class info
                        cReg += $3;
                        cReg += ")";
                        c += $3;
                        c += " ";
                    } else if ($4) {
                        for (key in engine.pseudoList) {
                            if (key.indexOf($4) > -1) { //look for the pseudo selector in key
                                (function (pseudo, paren, fnc) {
                                    fnA[count++] = function (candidates) {
                                        return fnc(pseudo, candidates, paren);
                                    }
                                }($4, $5, engine.pseudoList[key]));
                                break;
                            }
                        }
                    //TODO: Error message if pseudo didn't m any of the keys in pseudoList
                    } else if ($6) {
                        (function (attr, matchType, value) {
                            fnA[count++] = function (candidates) {
                                return engine.attr(attr, matchType, value, candidates);
                            }
                        }($6, $7, $8));
                    } else if ($9) {
                        if (tag || id || c || fnA.length > 0) {
                            engine.cache[lc.replace(/^ | $/g, "")] = candidates = engine.unique(engine.getEls(tag, id, c, cReg, fnA, combinator, candidates)); //cache selector segment
                            tag = id = undefined;
                            c = cReg = "";
                            fnA = [];
                            count = 0;
                        }
                        combinator = $9;
                    }
                });
                if (tag || id || c || fnA.length > 0) {
                    saved = saved.concat(engine.cache[lc] = engine.unique(engine.getEls(tag, id, c, cReg, fnA, combinator, candidates))); //cache selector group
                    tag = id = combinator = candidates = undefined;
                    c = cReg = "";
                    fnA = [];
                    count = 0;
                }
            }
        }
        return engine.cache[selector] = saved; //cache entire selector
    }

    engine.idCount = 0;
    engine.cache = {};
    engine.elInfo = {};

    engine.getEls = function (tag, id, c, cReg, fnA, combinator, candidates) {
        if (candidates.length < 1) { //if there were no matches on the previous selector segment lookup
            return [];
        }
        var current, start, stopOnFirstElement, stamp, cId, sibling, j,
        i = candidates.length,
        count = 0,
        holder = [],
        stamped = {};
        tag = tag ? tag.toUpperCase() : "*";
        if (cReg) {
            cReg = new RegExp(cReg);
        }
        switch (combinator) {
            case ">": //checks if children meet the criteria
                start = candidates[i - 1].firstElementChild !== undefined ? "firstElementChild" : "firstChild";
                break;
            case "+": //checks if the next younger sibling meets the criteria
                start = candidates[i - 1].nextElementSibling !== undefined ? "nextElementSibling" : "nextSibling";
                stopOnFirstElement = true;
                break;
            case "~": //checks if any of the younger siblings meet the criteria
                start = candidates[i - 1].nextElementSibling !== undefined ? "nextElementSibling" : "nextSibling";
                stamp = true;
                break;
            default: //goes here in the case of whitespace (decendancy check, or the first run
                if (id) { //check by id m
                    while (i--) {
                        current = document.getElementById(id);
                        if (!(!current
                            || (tag !== "*" && current.tagName !== tag)
                            || (c && !cReg.test(current.className))
                            || (candidates[i].contains && !candidates[i].contains(current))
                            || (candidates[i].compareDocumentPosition && candidates[i].compareDocumentPosition(current) !== 20))) {
                            holder[0] = current;
                            break;
                        }
                    }
                } else if (c) { //check by class m
                    while (i--) {
                        holder =  holder.concat(engine.byClass(c, tag, candidates[i]))
                    }
                } else { //check by tag m
                    while (i--) {
                        holder = holder.concat(engine.nodeListToArray(candidates[i].getElementsByTagName(tag)));
                    }
                }
        }
        if (start) {
            sibling = (j = start.length) > 11 ? "nextElementSibling" : "nextSibling";
                outer : while (i--) {
                    if (!(current = candidates[i][start])) {
                        continue;
                    }
                    do {
                        if (j > 11 || current.nodeType === 1) {
                            if (stamp) { //stamp ensures that elements are not iterated over more than once
                                cId = current.$id ? current.$id : (current.$id = engine.idCount++);
                                if (stamped[cId]) {
                                    break;
                                }
                                stamped[cId] = 1; //Value is irrelevant the element just needs an entry in stamped
                            }
                            if (!((tag !== "*" && current.tagName !== tag)
                                || (id && current.id !== id)
                                || (c && !cReg.test(current.className)))) {
                                holder[count++] = current;
                                if (id) { //If there is an id and we found a m we can break the outer loop as only one element to each id
                                    break outer;
                                }
                            }
                            if (stopOnFirstElement) {
                                break;
                            }
                        }
                    } while ((current = current[sibling]))
                }
        }
        i =  fnA.length;
        while (i-- && holder.length > 0) {
            holder = fnA[i](holder);
        }
        return  holder;
    };

    engine.check = function (fn, candidates) {
        /*
             * This is where pseudo and attribute selectors are checked.
             * fn is a function which returns true or false against the candidate.
             * If true, the candidate passes and is added to an array which eventually
             * becomes "candidates" in the main engine function
             *
             * The HTML Element should never get here as it can mess up pseudo
             * selectors which utilize ".parentNode"
             */
        var i = candidates.length,
        el = [],
        count = 0;
        while (i--) {
            if (fn(candidates[i])) {
                el[count++] = candidates[i];
            }
        }
        return el;
    };

    engine.byClass = function (c, tag, root) {
        /*
             * The c argument should be a space separated list of classes.
             * tag limits matches by tagName unless it is "*"
             * root specifies the root of getElementsByClassName/getElementsByTagName
             * (an element).
             *
             * tag and root are optional in which case "*" and
             * "document" are assumed
             *
             * Ex: engine.byClass("style1 style2", "p", document.body)
             *
             * This function will always return an array (not nodeList)
             */
        var nl, i,
        count = 0,
        array = [];
        tag = tag || "*";
        root = root || document;
        if (root.getElementsByClassName) { //browsers that support getElementsByClassName
            nl = root.getElementsByClassName(c);
            if (tag !== "*") {
                i = nl.length;
                while (i--) {
                    if (nl[i].tagName === tag) {
                        array[count++] = nl[i];
                    }
                }
            } else {
                array = engine.nodeListToArray(nl);
            }
        } else { //older browsers that don't support getElementsByClassName
            c = new RegExp(c.replace(/([a-zA-Z-_]\w*) ?/g, "(?=$1)")); //puts the class names into a regexp format that can be checked against .className. Regexps will look like /(?=class1)(?=class2)(?=classN)/
            nl = root.getElementsByTagName(tag);
            i = nl.length;
            while (i--) {
                if (c.test(nl[i].className)) {
                    array[count++] = nl[i];
                }
            }
        }
        return array;
    };

    engine.nodeListToArray = function (nl) {
        var array, count, i;
        try {
            array = [].slice.call(nl);
        } catch (e) {
            array = [];
            count = 0;
            i = nl.length;
            while (i--) {
                array[count++] = nl[i];
            }
        }
        return array;
    };

    engine.unique = function (array) {
        //removes duplicates from Arrays/nodeLists, returning an array; the first instance of a repeat will be preserved;
        //only works for array elements which can be compared using "==="
        var j,
        i = array.length,
        count = 0,
        array2 = [];
            find: while (i--) {
                j = count;
                while (j--) {
                    if (array2[j] === array[i]) {
                        continue find;
                    }
                }
                array2[count++] = array[i];
            }
        return array2;
    };

    engine.attr = function (attr, matchType, value, candidates) {
        /*
             * This is where CSS <= 3 attribute selectors are weeded through
             * attr represents the attribute; matchType is the type of match it
             * will look for in the attribute's value (value).
             *
             * Ex: [attribute=something]
             * attr - "attribute"
             * matchType - "="
             * value - "something"
             */
        var fn;
        (function (attr, v, m) {
            fn = function (c) {
                var a = attr.toLowerCase() === "class" ? c.className : c.getAttribute(attr);
                switch (m) {
                    case "~=":
                        return a && (a === v || a.indexOf(v + " ") === 0 || a.indexOf(" " + v + " ") > 0 || (a.indexOf(" " + v) > 0 && a.indexOf(" " + v) === a.length - v.length - 1));
                    case "^=":
                        return a && a.substr(0, v.length) === v;
                    case "!=":
                        return a && a !== v;
                    case "$=":
                        return a && a.indexOf(v, a.length - v.length) > -1;
                    case "*=":
                        return a && a.indexOf(v) > -1;
                    case "|=":
                        return a && (a === v || a.substr(0, v.length + 1) === v + "-");
                    case "=":
                        return a === v;
                    default:
                        return a;
                }
            }
        }(attr, value, matchType));
        return engine.check(fn, candidates);
    };

    engine.pseudoList = {};
    /*
         * Custom pseudo selectors can be added to the pseudoList object
         *
         * EXAMPLE:
         * engine.pseudoList["pseudoName"] = function (pseudo, candidates, paren) {
         * //Your code here
         * };
         *
         * When called the function will be passed 3 variables: the pseudoName,
         * candidates to check against, and, if applicable, the contents of parenthesis
         *
         * If a user passed the following selector:
         *      ":whatever(stuff)"
         * "whatever" would be the pseudoName and "stuff" would be the paren
         *
         * When the user provides a pseudo selector, it is checked against the keys
         * in the pseudoList object using the indexOf string function.
         * You can have one function handle multiple pseudo selectors by including each
         * pseudoName in the string. For example, the css3 pseudo function below
         * separates each pseudoName that it handles with a whitespace
         *
         * The function whose key matches first will be chosen.
         * Because a for... in loop is used to go through the keys, most
         * browsers should go in the order that each key is declared
         */
    engine.pseudoList["first-child last-child first-of-type last-of-type only-child only-of-type empty enabled disabled checked not contains nth-child nth-last-child nth-of-type nth-last-of-type"] = function (pseudo, candidates, paren) {
        /*
             * This is where CSS <= 3 pseudo selectors are processed
             * pseudo is the string following the colon and before any parenthesis
             * paren is the string that was within the parenthesis, if applicable
             *
             * Ex: :somePseudo(stuff)
             * psuedo - "somePsuedo"
             * paren - "stuff"
             */
        var match, fn;
        if(pseudo.indexOf("nth") < 0) {
            (function (pseudo, p) {
                fn = function (c) {
                    var pId;
                    if (pseudo.indexOf("-") > -1 && (!(pId = c.parentNode.$id) || !engine.elInfo[pId + "_childCount"])) {
                        engine.indexer(c);
                    }
                    pId = c.parentNode.$id;
                    switch (pseudo) {
                        case "empty":
                            return c.childNodes.length < 1;
                        case "enabled":
                            return c.disabled !== "disabled";
                        case "disabled":
                            return c.disabled === "disabled";
                        case "checked":
                            return c.checked;
                        case "not":
                            var array = engine(p),
                            i = array.length;
                            while (i--) {
                                if (c === array[i]) {
                                    return false;
                                }
                            }
                            return true;
                        case "contains":
                            return (c.textContent || c.innerText || "").indexOf(p) > -1;
                        case "first-child":
                            return engine.elInfo[c.$id + "-childIndex"] === 0;
                        case "last-child":
                            return engine.elInfo[c.$id + "-childIndex"] === engine.elInfo[pId + "_childCount"] - 1;
                        case "first-of-type":
                            return engine.elInfo[c.$id + "-typeIndex"] === 0;
                        case "last-of-type":
                            return engine.elInfo[c.$id + "-typeIndex"] === engine.elInfo[pId + "_childCount" + c.tagName] - 1;
                        case "only-child":
                            return engine.elInfo[pId + "_childCount"] === 1;
                        case "only-of-type":
                            return engine.elInfo[pId + "_childCount" + c.tagName] === 1;
                    }
                }
            }(pseudo, paren));
        } else {
            match = paren.match(/^ ?(?:([+-]?\d*)?(n) ?(?=[+-]|$))?([+-]? ?\d+|odd|even)?$/);
            /*
                 * In the case of "-3n + 6"
                 * m[1] = "-3"
                 * match[2] = "n"
                 * match[3] = "6"
                 */
            if (!match) { //if the regexp above could not find a m or if both #s are <= 0
                return [];
            } else if (match[3] === "even") {
                match[3] = 2;
                match[1] = 2;
            } else if (match[3] === "odd") {
                match[3] = 1;
                match[1] = 2;
            } else if (!match[1] && !match[3]) { //"n"
                return candidates;
            } else if (!match[3]) { //"3n"
                match[3] = match[1];
            } else if ((!match[1] && match[2]) || match[1] === "+" || match[1] === "-") { // "n+2" or "+n+2" or "-n+2"
                match[1] = match[1] + 1 - 0;
            } else if (!match[1]) { //"3"
                match[1] = 0;
            }
            match[3]--; //because 1 represents the first element we need to subtract 1 to get it on a zero based index
            (function (p, m) {
                fn = function (c) {
                    var pId, n;
                    if (!(pId = c.parentNode.$id) || !engine.elInfo[pId + "_childCount"]) {
                        engine.indexer(c);
                    }
                    pId = c.parentNode.$id;
                    switch (p) {
                        case "nth-child":
                            n = engine.elInfo[c.$id + "-childIndex"] - m[3];
                            break;
                        case "nth-last-child":
                            n = engine.elInfo[c.parentNode.$id + "_childCount"] - 1 - engine.elInfo[c.$id + "-childIndex"] - m[3];
                            break;
                        case "nth-of-type":
                            n = engine.elInfo[c.$id + "-typeIndex"] - m[3];
                            break;
                        case "nth-last-of-type":
                            n = engine.elInfo[c.parentNode.$id + "_childCount" + c.tagName] - 1 - engine.elInfo[c.$id + "-typeIndex"] - m[3];
                    }
                    return m[1] == 0 ? n == 0 : n % m[1] == 0 && n / m[1] >= 0;
                }
            }(pseudo, match));
        }
        return engine.check(fn, candidates);
    };

    engine.indexer = function (current) {
        /*
         * This indexes all the element siblings of current
         * Each element will receive a $id attribute which will associate with
         * an entry kept in the engine.elInfo object.
         *
         * In engine.elInfo, each element will have a count of the child index and
         * the type index.
         *
         * For example: a div is assigned the $id of "38" and in engine.elInfo
         * there are the following entries "38-childIndex" = "2" and a "38-typeIndex"
         * = "1"
         * This means that this div is the second child of it's parent and is the
         * first div
         *
         * Parent elements will have entries in engine.elInfo which not only
         * contain their childIndex and typeIndex, but will also contain ID#_childCount
         * and ID#_childCount[tagName]
         *
         * For example if body's entry in engine.elInfo contains childCount of "12",
         * PCount of "3" and DIVCount of "9", this would mean that body has 12
         * children, 3 are "P" elements and 9 are "DIV" elements.
         *
         * NOTE: On DOM changes the parentNode which is affected will have it's
         * parent related entries cleared from engine.elInfo
         */
        var pId, cId, parentTypeCountS, parentChildCountS;
        current = current.parentNode;
        pId = current.$id ? current.$id : (current.$id = engine.idCount++);
        if (engine.elInfo[pId + "_childCount"]) {
            return;
        }
        current = current.firstElementChild || current.firstChild;
        do {
            if (current.nodeType === 1) {
                cId = current.$id ? current.$id : (current.$id = engine.idCount++);
                parentChildCountS = parentTypeCountS = pId;
                parentTypeCountS += "_childCount";
                parentTypeCountS += current.tagName;
                if (!engine.elInfo[(parentChildCountS += "_childCount")]) {
                    engine.elInfo[parentChildCountS] = 0;
                }
                if (!engine.elInfo[parentTypeCountS]) {
                    engine.elInfo[parentTypeCountS] = 0;
                }
                engine.elInfo[cId + "-childIndex"] = engine.elInfo[parentChildCountS]++;
                engine.elInfo[cId + "-typeIndex"] = engine.elInfo[parentTypeCountS]++;
            }
        } while ((current = current.nextElementSibling || current.nextSibling));
    };

    engine.domChange = function (parent) {
        var key, pId;
        parent = parent.relatedNode || parent;
        engine.cache = {}; //clear the cache
        if ((pId = parent.$id + "_")) {
            for (key in engine.elInfo) {
                if (key.indexOf(pId) > -1) { //check if the entries in engine.elInfo have the pId followed by an underscore, if so they are the child count entries and are deleted
                    delete engine.elInfo[key];
                }
            }
        }
    };

    // DOM Change detection
    if (document.addEventListener) {
        document.addEventListener("DOMNodeInserted", engine.domChange, true);
        document.addEventListener("DOMNodeRemoved", engine.domChange, true);
    } else { //IE < 9
        /*
         * This emulates the DOM Mutation events by intercepting the DOM
         * manipulation methods (appendChild, removeChild, replaceChild,
         * insertBefore, insertCell, insertRow, innerHTML, document.write,
         * document.writeln).
         *
         * This method assumes DOM manipulation methods are not called until
         * after the DOM is loaded
         */
        engine.IEInitEl = function (el) {
            var l = 6,
            intercepts = ["appendChild", "removeChild", "replaceChild", "insertBefore", "insertCell", "insertRow"];
            while (l--) {
                if(el[intercepts[l]]) {
                    (function (fn) {
                        el[intercepts[l]] = function () {
                            engine.domChange(this);
                            try { //IE8
                                fn.apply(this, arguments);
                            } catch (e) { //IE 6 & 7
                                fn(arguments[0], arguments[1]);
                            }
                        }
                    }(el[intercepts[l]]));
                }
            }
            if (el.style) { //IE6 & 7 getting here through the stylesheet
                el.attachEvent("onpropertychange", function() { //TODO: detach event listener on page unlaod
                    if (event.propertyName === "innerHTML") {
                        engine.domChange(window.event.srcElement);
                    }
                });
                el.style.zoom = "1";
            } else { //IE8 getting here through prototyping
                (function (fn) {
                    Object.defineProperty(Element.prototype, "innerHTML", {
                        set: function () {
                            engine.domChange(this);
                            fn.apply(this, arguments);
                        }
                    });
                }(Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set));
            }
        };
        if (window.Element) { //IE8
            engine.IEInitEl(Element.prototype);
        } else { //IE 6 & 7
            /*
             * A new stylesheet is created with the following CSS code:
             *
             *  "* { zoom: expression(engine.IEInitEl(this))}"
             *
             *  This selects every element and runs the IEInitEl function in the
             *  context of every element. Within the IEInitEl function there is
             *  code that removes the expression from the element to ensure the
             *  expression is only run once per element.
             *
             *  Naturally, if elements already has a zoom property defined in
             *  their style, this will override it. Zoom was chosen because it
             *  is proprietary and unlikely, in my opinion, to be used.
             *  Consequently if an element's style is given the zoom attribute
             *  after this code runs and before the element runs the IEInitEl
             *  function, then the code will not work properly
             */
            var ss;
            (ss = document.createElement('style')).type = "text/css";
            ss.styleSheet.cssText = "*{zoom:expression(engine.IEInitEl(this))}";
            document.getElementsByTagName("head")[0].appendChild(ss);
        }
        (function () { //Intercepts document.write and document.writeln
            var intercepts = ["write", "writeln"],
            l = 2;
            while (l--) {
                (function (fn) {
                    document[intercepts[l]] = function () {
                        engine.domChange(this);
                        try {
                            fn.apply(this, arguments);
                        } catch (e) {
                            var i = 0;
                            while(arguments[i]) {
                                fn(arguments[i++]);
                            }
                        }
                    }
                }(document[intercepts[l]]));
            }
        }());
    }
})(document);