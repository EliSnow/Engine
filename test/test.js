(function () {
	function compareArrays(a, b) {
		var n = a.length;
		if (n == b.length) {
			while (n--) {
				if (a[n] !== b[n]) {
					return false;
				}
			}
			return true;
		}
		return false;
	}
	test("CSS3 Selectors", function () {
		location.hash = "#footer";
		var i, l, e, qsa,
			scope = document.getElementById("testElements"),
			testArray = [
			[":empty", scope],
			[":last-child", scope],
			[":first-of-type", scope],
			[":last-of-type", scope],
			[":only-child", scope],
			[":only-of-type", scope],
			[":checked", scope],
			[":enabled", scope],
			[":disabled", scope],
			["td:not(colspan)", scope],
			[":nth-child(even)", scope],
			[":nth-child(odd)", scope],
			[":nth-child(2)", scope],
			[":nth-child(-3n+5)", scope],
			[":nth-child(2n+3)", scope],
			[":nth-child(n)", scope],
			[":nth-child(2n-2)", scope],
			[":nth-last-child(even)", scope],
			[":nth-last-child(odd)", scope],
			[":nth-last-child(2)", scope],
			[":nth-last-child(-3n+5)", scope],
			[":nth-last-child(2n+3)", scope],
			[":nth-last-child(n)", scope],
			[":nth-last-child(2n-2)", scope],
			[":nth-of-type(even)", scope],
			[":nth-of-type(odd)", scope],
			[":nth-of-type(2)", scope],
			[":nth-of-type(-3n+5)", scope],
			[":nth-of-type(2n+3)", scope],
			[":nth-of-type(n)", scope],
			[":nth-of-type(2n-2)", scope],
			[":nth-last-of-type(even)", scope],
			[":nth-last-of-type(odd)", scope],
			[":nth-last-of-type(2)", scope],
			[":nth-last-of-type(-3n+5)", scope],
			[":nth-last-of-type(2n+3)", scope],
			[":nth-last-of-type(n)", scope],
			[":nth-last-of-type(2n-2)", scope],
			[":target"],
			[":root"]
		];
		for (i = 0, l = testArray.length; i < l; i++) {
			args = testArray[i];
			e = engine.apply(null, args);
			qsa = document.querySelectorAll("[data-css3testmatches~='" + i + "']");
			ok(compareArrays(e, qsa), args);
		}
	});
	test("CSS 4 and Engine Selectors", function () {
		var i, l, args, scope,
			pathParts = location.pathname.split("/");
		document.getElementById("currentDoc").href = location.href;
		document.getElementById("onePathPart").pathname = pathParts.slice(0, 2).join("/");
		document.getElementById("twoPathPart").pathname = pathParts.slice(0, 3).join("/");
		scope = document.getElementById("testElements"),
			testArray = [
				["[class=sOmEtHiNg i]", scope],
				["[class='something' i]", scope],
				["[class='^some\\w{5}$' r]", scope],
				["[class={0}]", scope, [/^some\w{5}$/]],
				["[class={someReg}]", scope, {someReg : /^some\w{5}$/}],
				["[class='^some\\w{5}$' ri]", scope],
				["[.className=stuff]", scope],
				[".stuff > [class!=sOmEtHiNg i]", scope],
				[".stuff > [class!='something' i]", scope],
				[".stuff > [class!='^some\\w{5}$' r]", scope],
				[".stuff > [class!='^some\\w{5}$' ri]", scope],
				[".stuff > [class!=something]", scope],
				[".stuff > [class!='something']", scope],
				["[class~=FoO i]", scope],
				["[class^=bAr i]", scope],
				["[class$=bAr i]", scope],
				["[class*=THING i]", scope],
				["[lang|=fR i]", scope],
				[":has(a)", scope],
				[":has(>a)", scope],
				[":has(~a)", scope],
				[":has(+a)", scope],
				[":contains(text)", scope],
				[":contains('text')", scope],
				[":contains('(t)e.\\1' r)", scope],
				[":contains('TEXT' i)", scope],
				[":contains('tEx.' ri)", scope],
				[":contains({0})", scope, [/(t)Ex\1/i]],
				[":contains({0})", scope, ["text"]],
				[":local-link", scope],
				[":local-link(0)", scope],
				[":local-link(1)", scope],
				[":local-link(2)", scope],
				[":any-link", scope],
				[".something > :not([lang],[href])", scope],
				["p:not(:contains(text i))", scope],
				[":referenced-by(data-sibling in div)", scope],
				[":matches(div)", scope],
				null, //deleted tests
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				[":nth-match(even of #testElements p)", scope],
				[":nth-match(odd of #testElements p)", scope],
				[":nth-match(2n+3 of #testElements p)", scope],
				[":nth-match(n of #testElements p)", scope],
				[":nth-match(2n-2 of #testElements p)", scope],
				[":nth-last-match(even of #testElements p)", scope],
				[":nth-last-match(odd of #testElements p)", scope],
				[":nth-last-match(2n+3 of #testElements p)", scope],
				[":nth-last-match(2n-2 of #testElements p)", scope],
				[":{0}", scope, [function (el) {return el.id;}]],
				[":{hasId}", scope, {hasId :function (el) {return el.id;}}],
				[":nth-match(1 of --:scope > *)", scope],
				["[.href]", scope]		
			];
		for (i = 0, l = testArray.length; i < l; i++) {
			args = testArray[i];
			if (args) {
				e = engine.apply(null, args);
				qsa = document.querySelectorAll("[data-css4testmatches~='" + i + "']");
				ok(compareArrays(e, qsa), args);			
			}
		}
	});
}());