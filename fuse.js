const {
  FuseBox,
  CSSPlugin,
  CSSModules,
  PostCSSPlugin,
  QuantumPlugin,
  WebIndexPlugin
} = require('fuse-box');
const { src, task, context } = require('fuse-box/sparky');
const { join } = require('path');
const express = require('express');
const autoprefixer = require('autoprefixer');

const { info } = console;

const POSTCSS_PLUGINS = [autoprefixer({ browsers: ['>0.25%', 'Explorer 11'] })];

const CLIENT_OUT = join(__dirname, 'build');
const TEMPLATE = join(__dirname, 'src/index.html');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

context(
  class {
    build() {
      return FuseBox.init({
        homeDir: 'src',
        output: `${CLIENT_OUT}/$name.js`,
        target: 'browser',
        sourceMaps: true,
        cache: !IS_PRODUCTION,
        allowSyntheticDefaultImports: true,
        alias: { '@': '~' },
        plugins: [
          [CSSModules(), PostCSSPlugin(POSTCSS_PLUGINS), CSSPlugin()],
          WebIndexPlugin({
            template: TEMPLATE,
            title: 'React Sandbox',
            path: '/'
          }),
          IS_PRODUCTION &&
            QuantumPlugin({
              bakeApiIntoBundle: 'app',
              uglify: true,
              treeshake: true,
              css: { clean: true }
            })
        ]
      });
    }
  }
);

task('dev-build', async context => {
  const fuse = context.build();

  fuse.dev({ root: false }, server => {
    const app = server.httpServer.app;
    app.use(express.static(CLIENT_OUT));
    app.get('*', (_, res) => {
      res.sendFile(join(CLIENT_OUT, 'index.html'));
    });
  });

  fuse
    .bundle('app')
    .hmr({ reload: true })
    .watch()
    .instructions('> index.tsx');

  await fuse.run();
});

task('prod-build', async context => {
  const fuse = context.build();

  fuse
    .bundle('app')
    .splitConfig({ dest: '/bundles' })
    .instructions('!> index.tsx');

  await fuse.run();
});

task('clean', () => src('./build/*').clean('./build/'));

/* MAIN BUILD TASK CHAINS  */
task('dev', ['clean', 'dev-build'], () => info('GET TO WORK'));

task('prod', ['clean', 'prod-build'], () => info('READY FOR PROD'));
