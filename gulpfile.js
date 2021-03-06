//This file will process all of the assets in the 'src' folder,
//combines them into 'build' folder as a finished app

//1. LIBRARIES
//------------
var gulp = require('gulp');
var Server = require('karma').Server;
var $ = require('gulp-load-plugins')();
var argv = require('yargs').argv;
var rimraf = require('rimraf');
var router = require('front-router');
var sequence = require('run-sequence');
var imagemin = require('gulp-imagemin');

//Check for --production flag
var isProduction = !!(argv.production);

//2. FILE PATHS
//------------

var paths = {
    //Include js, html and scss files
    assets: [
      './src/**/*.*',
      '!./src/{scss,app}/*.*',
      '!./src/{scss,app}/**',
      '!./src/app/**/*.*',
    ],
    // Sass will check these folders for files when you @import
    sass: [
      './src/scss',
      './bower_components/font-awesome/scss',
      './bower_components/ionic/scss'
    ],
    libs: [
      'bower_components/ionic/release/js/ionic.bundle.min.js',
      'bower_components/oclazyload/dist/ocLazyLoad.min.js',
      'bower_components/angular-base64/angular-base64.min.js',
      'bower_components/angular-md5/angular-md5.min.js',
      'bower_components/moment/min/moment.min.js',
      'bower_components/moment-range/dist/moment-range.min.js',
      'bower_components/angular-localforage/dist/angular-localForage.min.js',
      'bower_components/ngCordova/dist/ng-cordova.min.js',
      'bower_components/angular-modal-service/dst/angular-modal-service.min.js'
    ],
    //These files are for your app's Javascript
    //Remember to refresh this list when adding new files
    appJS: [
        './src/app/app.module.js',
        './src/app/*.js',
        './src/app/**/main.js',
        './src/app/services/*.js',
        './src/app/**/*.js'
    ],
    tpl: [
        './src/app/**/*.html',
        './src/app/commons/*.html',
        './src/app/commons/**/*.html'
    ]
};

//3. TASKS
//--------
//
/**
 * * Run test case once and exit
 * */
gulp.task('test', function (done) {
    new Server({
        configFile: __dirname + '/tests/karma.conf.js',
        singleRun: true
    }, done).start();
});

//Cleans the build directory
//Clean means delete all files in build directory
//rimraf is the node module for 'rm -rf' command
gulp.task('clean', function(cb) {
    rimraf('./www', cb);
});

//Copies everything in the client folder except templates, sass and js
gulp.task('copy', function() {
    return gulp.src(paths.assets, {
        base: './src/'
    })
      .pipe(gulp.dest('./www'));
});

gulp.task('copy:templates', function(cb) {
    // gulp.src('./src/app#<{(||)}>#*.html')
    gulp.src(paths.tpl, {
        base: './src/app/'
    })
      .pipe($.ngHtml2js({
          prefix: '/',
          moduleName: 'app',
          declareModule: false
      }))
      .pipe($.uglify())
      .pipe($.concat('templates.js'))
      .pipe(gulp.dest('./www/js'));

    cb();
});

// gulp.task('copy:views', function(cb) {
//     gulp.src('./src/js#<{(|#<{(|.html')
//       .pipe($.ngHtml2js({
//           prefix: 'views/',
//           moduleName: 'app',
//           declareModule: false
//       }))
//       .pipe($.uglify())
//       .pipe($.concat('views.js'))
//       .pipe(gulp.dest('./www/js'));
//
//     cb();
// });

gulp.task('compress:image', function() {
    gulp.src('./src/img/*.*')
        .pipe(imagemin())
        .pipe(gulp.dest('./www/img/'))
    ;
});

// Compiles Sass
gulp.task('sass', function () {
  return gulp.src('src/scss/app.scss')
    .pipe($.sass({
      includePaths: paths.sass,
      outputStyle: (isProduction ? 'compressed' : 'nested'),
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie 10']
    }))
    .pipe(gulp.dest('./www/css/'))
  ;
});

// Compiles and copies the Libs for Apps JavaScript, as well as your app's custom JS
gulp.task('uglify', ['uglify:libs', 'uglify:app'])

gulp.task('uglify:libs', function(cb) {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(paths.libs)
    .pipe(uglify)
    .pipe($.concat('libs.js'))
    .pipe(gulp.dest('./www/js/'))
  ;
});

gulp.task('uglify:app', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(paths.appJS)
    .pipe(uglify)
    .pipe($.concat('app.js'))
    .pipe(gulp.dest('./www/js/'))
  ;
});

// Starts a test server, which you can view at http://localhost:8079
gulp.task('server', ['build'], function() {
  gulp.src('./www')
    .pipe($.webserver({
      port: 8079,
      host: 'localhost',
      fallback: 'index.html',
      livereload: true,
      open: true
    }))
  ;
});
//Builds your entire app once, without starting a server
gulp.task('build', function(cb) {
  sequence('clean', ['copy', 'sass', 'uglify'], 'compress:image', 'copy:templates', cb);
});

//Default task: build your app, starts a server and recompile assets 
//when they changed
gulp.task('default', ['server'], function () {
  // Watch Sass
  gulp.watch(['./src/scss/**/*', './scss/**/*'], ['sass']);

  // Watch JavaScript
  gulp.watch(['./src/app/**/*', './app/**/*'], ['uglify:app']);

  // Watch static files
  gulp.watch(['./src/**/*.*', '!./src/views/**/*.*', '!./src/img/*.*', '!./src/{scss,app}/**/*.*'], ['copy']);

  gulp.watch(['./src/app/**/*.html', '/src/app/commons/*.html', '/src/app/commons/**/*.html'], ['copy:templates']);

  gulp.watch(['./src/img/*.*'], ['compress:image']);

  // gulp.watch(['./src/views#<{(|.html'], ['copy:views']);
});
