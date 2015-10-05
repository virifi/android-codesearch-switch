// http://blog.takanabe.tokyo/2015/05/23/663/
// http://qiita.com/yymm@github/items/1607084a78a92db9e682
// http://stackoverflow.com/questions/24190351/using-gulp-browserify-for-my-react-js-modules-im-getting-require-is-not-define

"use strict";

var gulp = require('gulp');
var glob = require('glob');
var source = require('vinyl-source-stream');

var browserify = require('browserify');
var watchify = require('watchify');
//var reactify = require('reactify');
var babelify = require('babelify');

var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');

var plumber = require('gulp-plumber');
var notify  = require('gulp-notify');


gulp.task('build:less', function () {
    return gulp.src('./src/less/*.less')
        .pipe(plumber({
            errorHandler: notify.onError("Error: <%= error.message %>")
        }))
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('public/css'))
        .pipe(notify('Successfully built : <%= file.relative %>'))
});

function buildJSX(entries, outFileName, watch) {
    var props = {
        entries: entries,
        //transform: [reactify],
        //transform: [babelify],
        debug: true, // Gives us sourcemapping
        fullPaths: watch // Requirement of watchify
    };
    var b = browserify(props)
        .transform(babelify.configure({
            optional: ['runtime']
        }));
    //var bundler = watch ? watchify(browserify(props)) : browserify(props);
    var bundler = watch ? watchify(b) : b;
    function rebundle() {
        return bundler.bundle()
            .on("error", notify.onError({
                title: "Compile Error",
                message: "<%= error.message %>"
            }))
            .pipe(source(outFileName))
            .pipe(gulp.dest('public/js'))
            .pipe(notify('Successfully built : <%= file.relative %>'));            
    }
    bundler.on('update', rebundle);
    return rebundle();
}
gulp.task('build:js', function () {
    return buildJSX('./src/js/popup.js', 'popup.js', false);
});

gulp.task('watch', function () {
    buildJSX('./src/js/popup.js', 'popup.js', true);
    gulp.watch('./src/less/**/*.less', ['build:less']);
});
gulp.task('default', ['build:js', 'build:less']);
