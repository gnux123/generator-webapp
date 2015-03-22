'use strict';

var join = require('path').join;
var util = require('util');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');

var message =
'\n               _oo0oo_' +
'\n              o8888888o'+
'\n              88" . "88'+
'\n              (| -_- |)'+
'\n              0\\  =  /0'+
'\n            ___/`---\'\\___'+
'\n          .\' \\\\|  卍  |// \'. '+
'\n         \/ \\\\|||  :  |||\/\/ \\'+
'\n        \/ _||||| -:- |||||- \\'+
'\n       |   | \\\\\\  -  \/\/\/ |   |'+
'\n       | \\_|  \'\'\\---\/\'\'  |_\/ |'+
'\n       \\  .-\\__  \'-\'  ___\/-. \/'+
'\n     ___\'. .\'  \/--.--\\  \'. .\'___'+
'\n   ."" \'< \'.___\\_<|>_\/___.\' >\' "".'+
'\n  | | : `- \\`.;`\\ _ \/`;.`\/ - ` : | |'+
'\n       佛祖保佑         永無BUG';

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    // setup the test-framework property, Gruntfile template will need this
    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });
    this.testFramework = this.options['test-framework'];

    this.option('coffee', {
      desc: 'Use CoffeeScript',
      type: Boolean,
      defaults: false
    });
    this.coffee = this.options.coffee;

    this.pkg = require('../package.json');
  },

  askFor: function () {
    var done = this.async();

    // welcome message
    if (!this.options['skip-welcome-message']) {

      this.log(message);
      this.log(chalk.magenta(
        'Out of the box I include HTML5 Boilerplate, jQuery, and a ' +
        'Gruntfile.js to build your app.'
      ));
    }

    var prompts = [{
      type: 'checkbox',
      name: 'features',
      message: 'What more would you like?',
      choices: [{
        name: 'Sass',
        value: 'includeSass',
        checked: true
      },{
        name: 'Modernizr',
        value: 'includeModernizr',
        checked: true
      },{
        name: 'support IE Old Version(IE6 - IE9)',
        value: 'includeltIE',
        checked: false
      },{
        name: 'font-aweasome(webFont Icons)',
        value: 'includefontAewasome',
        checked: false
      },{
        name: 'animate.css(easy use animate)',
        value: 'includeAnimateCss',
        checked: false
      },{
        name: 'slick-carousel(slide Banner effects for responsive)',
        value: 'includeSlickCarousel',
        checked: false        
      },{
        name: 'Bootstrap',
        value: 'includeBootstrap',
        checked: false
      }]
    }, {
      when: function (answers) {
        return answers && answers.features &&
          answers.features.indexOf('includeSass') !== -1;
      },
      type: 'confirm',
      name: 'libsass',
      value: 'includeLibSass',
      message: 'Would you like to use libsass? Read up more at \n' +
        chalk.green('https://github.com/andrew/node-sass#node-sass'),
      default: false
    }];

    this.prompt(prompts, function (answers) {
      var features = answers.features;

      function hasFeature(feat) {
        return features && features.indexOf(feat) !== -1;
      }

      this.includeSass = hasFeature('includeSass');
      this.includeBootstrap = hasFeature('includeBootstrap');
      this.includeModernizr = hasFeature('includeModernizr');
      this.includeltIE = hasFeature('includeltIE');
      this.includefontAewasome = hasFeature('includefontAewasome');
      this.includeSlickCarousel = hasFeature('includeSlickCarousel');
      this.includeAnimateCss = hasFeature('includeAnimateCss');
      

      this.includeLibSass = answers.libsass;
      this.includeRubySass = !answers.libsass;

      done();
    }.bind(this));
  },

  gruntfile: function () {
    this.template('Gruntfile.js');
  },

  packageJSON: function () {
    this.template('_package.json', 'package.json');
  },

  git: function () {
    this.template('gitignore', '.gitignore');
    this.copy('gitattributes', '.gitattributes');
  },

  bower: function () {
    var bower = {
      name: this._.slugify(this.appname),
      private: true,
      dependencies: {},
      devDependencies: {}

    };

    if (this.includeBootstrap) {
      var bs = 'bootstrap' + (this.includeSass ? '-sass-official' : '');
      bower.dependencies[bs] = "~3.2.0";
    } else {
      bower.dependencies.jquery = "~1.11.1";
    }

    if (this.includeModernizr) {
      bower.dependencies.modernizr = "~2.8.2";
    }

    if (this.includeltIE) {
      bower.dependencies['lt-ie-9'] = "~0.1.0";
    }    

    if (this.includefontAewasome) {
      bower.devDependencies['font-awesome'] = "https://github.com/gnux123/font-awesome.git";
    }

    if (this.includeSlickCarousel) {
      bower.dependencies['slick-carousel'] = "1.4.1";
    }

    if (this.includeAnimateCss) {
      bower.devDependencies['animate.scss'] = "https://github.com/gnux123/animate.scss.git";
    }    

    this.copy('bowerrc', '.bowerrc');
    this.write('bower.json', JSON.stringify(bower, null, 2));
  },

  jshint: function () {
    this.copy('jshintrc', '.jshintrc');
  },

  editorConfig: function () {
    this.copy('editorconfig', '.editorconfig');
  },

  mainStylesheet: function () {
    var css = 'main.' + (this.includeSass ? 's' : '') + 'css';
    var cssPath = 'app/styles/';
    this.template(css, cssPath + css);

    this.copy('_function.scss', cssPath + '_function.scss');
    this.copy('_mixin.scss', cssPath + '_mixin.scss');
    this.copy('_settings.scss', cssPath + '_settings.scss');
    this.copy('vendor.scss', cssPath + 'vendor.scss');
  },

  writeIndex: function () {
    this.indexFile = this.engine(
      this.readFileAsString(join(this.sourceRoot(), 'index.html')),
      this
    );

    // wire Bootstrap plugins
    if (this.includeBootstrap && !this.includeSass) {
      var bs = 'bower_components/bootstrap/js/';

      this.indexFile = this.appendFiles({
        html: this.indexFile,
        fileType: 'js',
        optimizedPath: 'scripts/plugins.js',
        sourceFileList: [
          bs + 'affix.js',
          bs + 'alert.js',
          bs + 'dropdown.js',
          bs + 'tooltip.js',
          bs + 'modal.js',
          bs + 'transition.js',
          bs + 'button.js',
          bs + 'popover.js',
          bs + 'carousel.js',
          bs + 'scrollspy.js',
          bs + 'collapse.js',
          bs + 'tab.js'
        ],
        searchPath: '.'
      });
    }

    this.indexFile = this.appendFiles({
      html: this.indexFile,
      fileType: 'js',
      optimizedPath: 'scripts/main.js',
      sourceFileList: ['scripts/main.js'],
      searchPath: ['app', '.tmp']
    });
  },

  app: function () {
    this.directory('app');
    this.mkdir('app/scripts');
    this.mkdir('app/styles');
    this.mkdir('app/images');
    this.write('app/index.html', this.indexFile);

    if (this.coffee) {
      this.write(
        'app/scripts/main.coffee',
        'console.log "\'Allo from CoffeeScript!"'
      );
    }
    else {
      this.write('app/scripts/main.js', 'console.log(\'\\\'佛祖保佑 \\\'永無BUG!\');');
    }
  },

  install: function () {
    this.on('end', function () {
      this.invoke(this.options['test-framework'], {
        options: {
          'skip-message': this.options['skip-install-message'],
          'skip-install': this.options['skip-install'],
          'coffee': this.options.coffee
        }
      });

      if (!this.options['skip-install']) {
        this.installDependencies({
          skipMessage: this.options['skip-install-message'],
          skipInstall: this.options['skip-install']
        });
      }
    });
  }
});
