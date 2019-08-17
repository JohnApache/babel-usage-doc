import gulp from 'gulp';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import del from 'del';

const paths = {
    scripts: {
      src: 'src/**/*.js',
      dest: 'dist/'
    }
};

const clean = () => del([ 'dist' ]);

const scripts = () => {
    return gulp.src(paths.scripts.src, { sourcemaps: true })
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.dest));
}

const build = gulp.series(clean, gulp.parallel(scripts));

export default build;

