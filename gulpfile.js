const gulp = require("gulp");
const babel = require("gulp-babel"),
	  concat = require('gulp-concat'),
	  uglify = require('gulp-uglify'),
	  rename = require('gulp-rename'),
	  minificss = require('gulp-minify-css'),
	  autoprefixer = require('gulp-autoprefixer');

/* js 병합 */
gulp.task('combine:js', (done) => {
	gulp
		.src(['src/js/utils.js', 'src/js/jsSlide.js'])
		.pipe(concat('jsSlide.min.js'))
		.pipe(babel())
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
	done();
});

/* css 병합 */
gulp.task('combine:css', (done) => {
	gulp
		.src(['src/css/**/*.css'])
		.pipe(autoprefixer())
		.pipe(minificss())
		.pipe(rename('jsSlide.min.css'))
		.pipe(gulp.dest('dist/css'));
	done();
});

/* image 이동 */
gulp.task('add:images', (done) => {
	gulp
		.src(['src/images/**/*'])
		.pipe(gulp.dest('dist/images'));
	done();
});

gulp.task('default', gulp.series('combine:js', 'combine:css', 'add:images'));