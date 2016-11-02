"use strict"

/*eslint no-console: 0*/

var path = require('path');
var gulp = require('gulp');
var babel = require('gulp-babel');
var newer = require("gulp-newer");
var using = require('gulp-using');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript')
var rimraf = require('rimraf')
var appRoot = require('app-root-path');
var opts = process.argv.slice(2);

// MUST END WITH A SLASH / !!
// 
var SRC = 'src/';
var DEST = 'dist/';

var DEBUG = false;

function getGlob(src) {
    return path.join(src,  '**', '*.ts');
}

function isDir(path) {
    return ['/', '\\'].indexOf(path.slice(-1)) >= 0;
}
function hasOpt(opt) {
    return opts.indexOf('--'+opt) >= 0;
}

function setGlobalOptions() {
    DEBUG = hasOpt('debug');
}

function logOptions(src, dest, opts) {
    gutil.log("Source: " + src);
    gutil.log("Target: " + dest);
    if (opts) { 
        gutil.log("Options: " + JSON.stringify(opts));
    }
}

function logError(err) {
    gutil.log("ERROR:" + err.message ? err.message : err);
    err.codeFrame && gutil.log('Code:\n' + err.codeFrame);
    DEBUG && err.stack && gutil.log('Stack:\n' + err.stack);
   
}

function watch (src, dest) {
    gulp.watch(getGlob(src), function(evt) {
        var destFolder = pathTo(src, evt.path, dest);
        console.log(destFolder)
        build(evt.path, destFolder).catch(logError);
    });
}

function pathTo(srcRoot, src, dest) {

    if (src.substring(0, srcRoot.length) !== srcRoot) {
        throw new Error("srcRoot doesn't seem to match src");
    }

    var suffix = src.substring(srcRoot.length);
    var destRelativePath = path.dirname(suffix);
    return path.join(dest, destRelativePath);
}

function build(src, dest, rebuildAll) {
    
    return new Promise(function(resolve, reject) {
        if (rebuildAll) {
            gutil.log(`deleting "${dest}"`);
            rimraf(dest, function(err) {
                if (err) return reject(err);
                resolve();
            });
        } else {
            resolve();
        }
    }).then(function() {

        var gulpSrc = isDir(src) ?
            getGlob(src) :
            src;
        
        var stream = gulp.src(gulpSrc);

        if (!rebuildAll) {
            stream = stream.pipe(newer(dest));
        }

        return new Promise(function(resolve, reject) {
            var optDts = hasOpt('dts')
            var tsproject = ts.createProject(path.join(process.cwd(), "tsconfig.json"),
            {
                typescript: require(path.join(process.cwd(), "node_modules/typescript")),
                declaration: optDts
                //noExternalResolve: true
            });


            stream = stream.pipe(using({
                    prefix: '-->'
                }))
                .pipe(sourcemaps.init())
        
            const tsResult = stream.pipe(ts(tsproject));
            if (optDts) {
        
                let target = tsResult.dts;

                target.pipe(gulp.dest(dest));

                stream = tsResult.js;
            } else {
                stream = tsResult;
            }

            stream.pipe(babel())
                .on('error', reject)
                .pipe(sourcemaps.write())
                .pipe(gulp.dest(dest))
                .on('end', resolve);
            console.log(dest)
        });
    });
}

function fail(err) {
    logError(err);
    process.exit(1);
}

gulp.task('build', function () {
    let src = appRoot.resolve(SRC);
    let dest =appRoot.resolve(DEST);
    let rebuildAll = hasOpt('all');
    setGlobalOptions();
    logOptions(src, dest, { all: rebuildAll });
    return build(src, dest, rebuildAll).catch(fail);
});

gulp.task('watch', function () {
    let src = appRoot.resolve(SRC);
    let dest =appRoot.resolve(DEST);
    setGlobalOptions();
    logOptions(src, dest);
    return watch(src, dest);
});

gulp.task('default', ['build']);

// options: all, dts, debug
