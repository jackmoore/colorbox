module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: [
				"/*",
				"	<%= pkg.name %> v<%= pkg.version %>",
				"	(c) 2013 Jack Moore - jacklmoore.com",
				"	license: http://www.opensource.org/licenses/mit-license.php",
				"*/",
				""
			].join("\n")
		},
		jshint: {
			all: ['Gruntfile.js', 'src/jquery.colorbox.js'],
			options: {
				curly: true,
				eqeqeq: true,
				eqnull: true,
				browser: true,
				globals: {
					jQuery: true
				}
			}
		},
		concat: {
			all: {
				src: ['src/jquery.colorbox.js'],
				dest: 'colorbox/jquery.colorbox.js'
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},
		uglify: {
			all: {
				files: {
					'colorbox/jquery.colorbox-min.js': ['src/jquery.colorbox.js']
				}
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},
		watch: {
			files: ['Gruntfile.js', 'src/jquery.colorbox.js'],
			tasks: ['concat']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};