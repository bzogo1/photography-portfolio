import gulp from 'gulp';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import filter from 'gulp-filter';
import path from 'path';
import del from 'del';
import sharp from 'sharp';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

const sass = gulpSass(dartSass);
const cssSourceGlob = './assets/sass/**/*.scss';
const cssOutputDir = './assets/css';
const sourceImageDir = './photos';
const fullImageDir = './images/fulls';
const thumbImageDir = './images/thumbs';
const generatedCssFiles = [
    `${cssOutputDir}/custom.min.css`,
    `${cssOutputDir}/main.min.css`,
    `${cssOutputDir}/noscript.min.css`
];

gulp.task('delete', function () {
    return del([
        `${fullImageDir}/*.*`,
        `${thumbImageDir}/*.*`
    ]);
});

gulp.task('resize-images', async function () {
    await fsPromises.mkdir(fullImageDir, { recursive: true });
    await fsPromises.mkdir(thumbImageDir, { recursive: true });

    const files = await fsPromises.readdir(sourceImageDir, { withFileTypes: true });
    const imageFiles = files
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => /\.(jpe?g|png|gif|webp)$/i.test(name));

    for (const fileName of imageFiles) {
        const sourcePath = path.join(sourceImageDir, fileName);
        const fullTarget = path.join(fullImageDir, fileName);
        const thumbTarget = path.join(thumbImageDir, fileName);

        await sharp(sourcePath)
            .resize({ width: 1600, fit: 'inside', withoutEnlargement: true })
            .toFile(fullTarget);

        await sharp(sourcePath)
            .resize({ width: 500, fit: 'inside', withoutEnlargement: true })
            .toFile(thumbTarget);
    }
});

// clear previously generated css
gulp.task('clean-css', function () {
    return del(generatedCssFiles);
});

// compile scss to css
gulp.task('sass', gulp.series('clean-css', function compileSass() {
    return gulp.src(cssSourceGlob)  // Target all .scss files
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(rename(function (path) {
            path.basename += '.min';  // Append .min to the output filename
        }))
        .pipe(gulp.dest(cssOutputDir));  // Output to the CSS directory
}));

// watch changes in scss files and run sass task
gulp.task('sass:watch', function () {
    gulp.watch('./assets/sass/**/*.scss', gulp.series('sass'));
});

// minify js
gulp.task('minify-js', function () {
    return gulp.src('./assets/js/**/*.js')
        .pipe(filter(function (file) {
            const filePath = file.path;
            const basename = path.basename(filePath, '.js');
            
            // Skip files that are already minified
            return !basename.endsWith('.min');
        }))
        .pipe(uglify())
        .pipe(rename(function (path) {
            path.basename += '.min';
            path.extname = '.js';
        }))
        .pipe(gulp.dest('./assets/js'));
});

// build task
gulp.task('build', gulp.series('sass', 'minify-js'));

// resize images
gulp.task('resize', gulp.series('delete', 'resize-images'));

// default task
gulp.task('default', gulp.series('build', 'resize'));