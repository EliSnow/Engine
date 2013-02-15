module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		concat : {
			js : {
				src : "engine.js",
				dest : "dist/engine.js"
			}
		},		
		lint : {
			beforeExclude : "engine.js",
			afterExclude : "dist/engine.js"
		},
		min : {
			"dist/engine.min.js" : "dist/engine.js"
		}
	});
	
	grunt.registerTask("default", "lint:beforeExclude concat min");
	
	grunt.registerHelper("removeSection", function (script, secNameStart, secNameEnd, all) {
		var regEscape = /[-/\\^$*+?.()|[\]{}]/g,
			flag = all
				? "g"
				: "";
		//comment out special RegExp characters in secNameStart and secNameEnd
		secNameStart = secNameStart.replace(regEscape, "\\$&");
		secNameEnd = secNameEnd.replace(regEscape, "\\$&");
		return script.replace(
			new RegExp("/\\*" + secNameStart + "\\*/[\\s\\S]*?/\\*" + secNameEnd + "\\*/", flag),
			""
		);
	});
	
	grunt.registerTask("exclude", function () {
		grunt.task.run("lint:afterExclude");
		this.requires("concat");
		this.requiresConfig("concat.js.dest");
		var l,
			src = grunt.file.read(grunt.config("concat").js.dest);
		[].slice.call(arguments).forEach(function(section) {
			l = src.length;
			src = grunt.helper("removeSection", src, section + "_start", section + "_end", true);
			if (src.length == l) {
				grunt.log.writeln(("Could not find section \"" + section + "\"").yellow);
			}
		});
		grunt.file.write(grunt.config("concat").js.dest, src);
	});
	
};