var Generator = require('yeoman-generator');
var mkdirp = require('mkdirp');

module.exports = class extends Generator {
  prompting() {
    return this.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Page name',
        validate: str => {
          if (str.trim().length > 0) {
            return true;
          }
          return 'Please add a name for your new page';
        },
      },
      {
        type: 'input',
        name: 'title',
        message: 'Page title',
        validate: str => {
          if (str.trim().length > 0) {
            return true;
          }
          return 'Please add a name for your new page';
        },
      },
      {
        type: 'confirm',
        name: 'createReducer',
        message: 'Would you like to create reducer for this page?',
        default: false,
      },
    ]).then(answers => {
      this.answers = {
        name: answers.name,
        title: answers.title,
        createReducer: answers.createReducer,
      };
    });
  }

  writing() {
    const { name, title, createReducer } = this.answers;
    const nameWithLowerCase = name.charAt(0).toLowerCase() + name.slice(1);
    const className = `${nameWithLowerCase}-page`;
    const component = name.charAt(0).toUpperCase() + name.slice(1);

    // create folder project
    mkdirp(`pages/${nameWithLowerCase}`);

    // copy page into the pages folder
    this.fs.copyTpl(
      this.templatePath('_page.js'),
      this.destinationPath(`pages/${nameWithLowerCase}/index.tsx`),
      {
        component,
        className,
        i18n: nameWithLowerCase,
        title,
      }
    );

    // copy styles.scss
    this.fs.copyTpl(
      this.templatePath('_styles.scss'),
      this.destinationPath(`pages/${nameWithLowerCase}/styles.scss`),
      {
        className,
      }
    );

    // copy i18n.json
    this.fs.copyTpl(
      this.templatePath('_i18n.json'),
      this.destinationPath(`static/locales/en/${nameWithLowerCase}.json`),
      {
        title,
      }
    );
    // copy unit test.js
    this.fs.copyTpl(
      this.templatePath('_test.js'),
      this.destinationPath(`tests/units/pages/${nameWithLowerCase}.test.js`),
      {
        component,
        nameWithLowerCase,
      }
    );

    const linkItem = `
      <MenuItem
        key={uuid()}
        className={asPath === '/${nameWithLowerCase}' ? activeClass : ''}
      >
        <Link href="/${nameWithLowerCase}">
          <a>${title}</a>
        </Link>
      </MenuItem>
    `;

    const LAYOUT_PATH = './components/global/layout/index.tsx';

    // update server.js to add the new namespace to the list
    this.fs.copy(LAYOUT_PATH, LAYOUT_PATH, {
      process: function(content) {
        var regEx = new RegExp(/{\/\* new-menu-item \*\/}/, 'g');
        var newContent = content
          .toString()
          .replace(regEx, `${linkItem}\n\t\t\t\t\t{/* new-menu-item */}`);
        return newContent;
      },
    });

    // update server.js to add the new namespace to the list
    const SERVER_PATH = './server.js';

    this.fs.copy(SERVER_PATH, SERVER_PATH, {
      process: function(content) {
        var regEx = new RegExp(/\/\* new-i18n-namespace-here \*\//, 'g');
        var newContent = content
          .toString()
          .replace(
            regEx,
            `, '${nameWithLowerCase}'/* new-i18n-namespace-here */`
          );
        return newContent;
      },
    });

    // Add reducer for this page
    if (createReducer) {
      this.composeWith(
        'nextjs-typescript-antd:reducer',
        {
          options: {
            name: name,
            appName: this.appName,
          },
        },
        {
          local: require.resolve('../reducer'),
        }
      );
    }
  }
};
