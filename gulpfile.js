let browsersync = require('browser-sync');
let cached = require('gulp-cached');
let cssnano = require('gulp-cssnano');
let del = require('del');
let fileinclude = require('gulp-file-include');
let gulp = require('gulp');
let gulpif = require('gulp-if');
let npmdist = require('gulp-npm-dist');
let replace = require('gulp-replace');
let uglify = require('gulp-uglify');
let useref = require('gulp-useref-plus');
let rename = require('gulp-rename');
let gulpsass = require('gulp-sass');
let sass = require('sass');
let autoprefixer = require("gulp-autoprefixer");
let sourcemaps = require("gulp-sourcemaps");
let cleanCSS = require('gulp-clean-css');

let sass$ = gulpsass(sass)
let browsersync$ = browsersync.create();

const isSourceMap = true;

const sourceMapWrite = (isSourceMap) ? "./" : false;

function browsersyncFn(callback) {
	var baseDir = './dist';
	browsersync$.init({
		server: {
			baseDir: [baseDir, baseDir + '/html'],							// Specify the base path of the project
			// index: "html/index.html"										// Has to specify the initial page in case not the index.html
		},
		port: 1111,															// Used to change the port number
		// tunnel: 'technology', 											// Attempt to use the URL https://someTunnelName.loca.lt
	});
	callback();
};

function browsersyncReload(callback) {
	browsersync$.reload();
	callback();
};

function watch() {
	// Below  are the files which will be watched and to skip watching files use '!' before the path.
	gulp.watch(['./src/assets/scss/**/*', '!./src/assets/switcher/*.scss'], gulp.series('scss', browsersyncReload));
	gulp.watch(['./src/assets/js/*', './src/assets/js/*.js'], gulp.series('js', browsersyncReload));
	gulp.watch(['./src/assets/plugins/*', './src/assets/plugins/**/*.js'], gulp.series('plugins', browsersyncReload));
	gulp.watch(['./src/html/**/*.html', './src/html/partials/*'], gulp.series('html', browsersyncReload));
};

function html(callback) {
	// Html files path
	var htmlFiles = './src/html/**/*.html';

	gulp
		.src(htmlFiles)
		// .pipe(vinylPaths(del))
		.pipe(fileinclude({
			prefix: '@SPK@',					// This is the prefix you can edit which is used in project to combine html files
			basepath: '@file',
			indent: true,
		}))
		.pipe(useref())
		.pipe(cached())
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', cssnano({
			svgo: false
		})))
		.pipe(gulp.dest('./dist/html'));
	//  Used to remove the partials/ any other folder/file
	del.sync('./dist/html/partials')
	callback();
};

function scss(callback) {
	// SCSS path where code was written
	var scssFiles = './src/assets/scss/**/*.scss';
	var cssFiles = './src/assets/css/';
	// CSS path where code should need to be printed
	var cssDest = './dist/assets/css';
	// Normal file
	gulp
		.src(scssFiles)
		.pipe(sourcemaps.init())						// To create map file we should need to initiliaze.
		.pipe(sass$.sync().on('error', sass$.logError))	// To check any error with sass sync
		.pipe(
			autoprefixer()
		)
		.pipe(gulp.dest(cssDest))
		.pipe(gulp.dest(cssFiles))
	//  Minified file
	gulp
		.src(scssFiles)
		.pipe(sourcemaps.init())						// To create map file we should need to initiliaze.
		.pipe(sass$.sync().on('error', sass$.logError))	// To check any error with sass sync
		.pipe(
			autoprefixer()
		)
		.pipe(gulp.dest(cssDest))
		.pipe(gulp.dest(cssFiles))
		.pipe(cleanCSS({ debug: true }, (details) => {
		}))
		.pipe(
			rename({
				suffix: ".min"
			})
		)
		.pipe(sourcemaps.write(sourceMapWrite))			// To create map file
		.pipe(gulp.dest(cssDest))
		.pipe(gulp.dest(cssFiles))
	return callback();
};

function js(callback) {
	var jsFilePath = './dist/assets/js';			// The javascript main Folder.
	// normal file
	gulp.src('./src/assets/js/*.js')			// The *.js will select all the files which have extension of '.js'.
		.pipe(sourcemaps.init())
		.pipe(gulp.dest(jsFilePath))				// The path where the new file should need to be created.
	// minified file
	// gulp.src('./src/assets/js/*.js')			// The *.js will select all the files which have extension of '.js'.
	// 	.pipe(sourcemaps.init())
	// 	.pipe(uglify())								// uglify() is used to minify the javascript.
	// 	.pipe(
	// 		rename({								// rename is used to add dirname, basename, extname, prefix, suffix.
	// 			suffix: ".min"
	// 		})
	// 	)
	// 	.pipe(sourcemaps.write(sourceMapWrite))		// To create map file
	// 	.pipe(gulp.dest(jsFilePath));				// The path where the new file should need to be created.
	return callback()
};

function plugins(callback) {
	var pluginsFilePath = './dist/assets/plugins/';			// The javascript main Folder.
	// normal file
	gulp.src('./src/assets/plugins/**/*.js')			// The *.js will select all the files which have extension of '.js'.
		.pipe(sourcemaps.init())
		.pipe(gulp.dest(pluginsFilePath));				// The path where the new file should need to be created.
	// minified file
	gulp.src('./src/assets/plugins/**/*.js')			// The *.js will select all the files which have extension of '.js'.
		.pipe(sourcemaps.init())
		.pipe(uglify())								// uglify() is used to minify the javascript.
		.pipe(
			rename({								// rename is used to add dirname, basename, extname, prefix, suffix.
				suffix: ".min"
			})
		)
		.pipe(sourcemaps.write(sourceMapWrite))		// To create map file
		.pipe(gulp.dest(pluginsFilePath));				// The path where the new file should need to be created.

	return callback();
};

function copyLibs() {

	var destPath = 'dist/assets/libs';

	return gulp
		.src(npmdist(), {
			base: './node_modules'
		})
		.pipe(rename(function (path) {
			path.dirname = path.dirname.replace(/\/dist/, '').replace(/\\dist/, '');
		}))
		.pipe(gulp.dest(destPath));
};


function cleanDist(callback) {
	del.sync('./dist');								// Used to clear dist folder
	callback();
};

function copyAll() {
	var assetsPath = './dist/assets';					// The file path where we want to copy the data from

	return gulp
		.src([
			'./src/assets/**/*',					// All the folder and files will be will copied.
		])
		.pipe(gulp.dest(assetsPath));				// dest() - A stream that can be used in the middle or at the end of a pipeline to create files on the file system.
};

const build = gulp.series(
	gulp.parallel(cleanDist, copyAll, html, scss, js, plugins),
	gulp.parallel(scss, html, js, plugins));

const defaults = gulp.series(
	gulp.parallel(cleanDist, copyAll, html, scss, js, plugins, copyLibs),
	gulp.parallel(browsersyncFn, watch, html, js, scss, plugins));


// Export tasks
exports.browsersyncReload = browsersyncReload;
exports.browsersyncFn = browsersyncFn;
exports.plugins = plugins;
exports.js = js;
exports.scss = scss;
exports.html = html;
exports.cleanDist = cleanDist;
exports.copyAll = copyAll;
exports.watch = watch;
exports.build = build;
exports.default = defaults;