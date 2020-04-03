const yargs = require('yargs');
const path = require('path');
const mkdirp = require('mkdirp');
const inquirer = require('inquirer');
const globby = require('globby');
const istextorbinary = require('istextorbinary');
const fs = require('fs');

class Command {
  constructor() {
    this.variables = {};
  }
  async run(cwd, argv) {
    this.cwd = cwd;
    this.args = this.parseArgv(argv || []);
    this.targetDir = await this.getTargetDir();
    if (!this.targetDir) {
      return Promise.reject('find target directory fail');
    }
    this.templateDir = await this.getTemplateDir();
    if (!this.templateDir) {
      return Promise.reject('find template directory fail');
    }
    await this.processFiles(this.targetDir, this.templateDir);
    return Promise.resolve('create project success');
  }

  async getTargetDir() {
    const {
      force,
    } = this.args;
    const dir = this.args._[0] || this.args.dir || '';
    let target = path.resolve(this.cwd, dir);

    const validate = d => {
      if (!fs.existsSync(d)) {
        mkdirp.sync(d);
        return true;
      }

      if (!fs.statSync(target).isDirectory()) {
        this.log(`${d} is a exsit file`);
        return false;
      }

      const files = fs.readdirSync(target).filter(f => f[0] !== '.');
      if (files.length > 0) {
        if (force) {
          this.log(`${d} is not empty, force override`);
          return true;
        }
        this.log(`${d} already exsit`);
        return false;
      }
      return true;
    }

    if (!validate(target)) {
      const result = await inquirer.prompt([{
        name: 'dir',
        type: 'string',
        message: 'please enter target dir',
        default: dir || '.',
        filter: dir => path.resolve(this.cwd, dir),
        validate,
      }]);
      target = result.dir;
    }
    return target;
  }

  async getTemplateDir() {
    const template = this.args.template;
    let temp;
    if (template) {
      temp = path.resolve(this.cwd, template);
      if (fs.existsSync(temp)) {
        if (!fs.existsSync(path.join(temp, 'template'))) {
          this.log(`template dir must contain template dirctory`);
          temp = null;
        }
      } else {
        this.log(`find template root dir fail: ${temp}`);
        temp = null;
      }
    }
    if (!temp) {
      temp = await this.getTemplateDirByType();
    }
    this.log(`template root dir: ${temp}`);
    return temp;
  }

  async getTemplateDirByType() {
    const type = this.args.type;
    let temp;
    if (type) {
      temp = path.resolve(__dirname, type);
      if (!fs.existsSync(temp)) {
        this.log(`type: ${type} -> ${temp} not support.`);
        temp = null;
      }
    }
    return temp;
  }

  async processVariable(targetDir, templateDir) {
    const config = require(templateDir);
    let questions = config.replace;
    if (!questions) {
      return {};
    }
    if (typeof questions === 'function') {
      questions = questions(this);
    }
    if (questions.name && !questions.name.default) {
      questions.name.default = path.basename(targetDir);
    }
    const keys = Object.keys(questions);
    if (this.args.silent) {
      const results = keys.reduce((results, key) => {
        let defaultFun = questions[key].default;
        if (typeof defaultFun === 'function') {
          results[key] = defaultFun(results) || '';
        } else {
          results[key] = defaultFun || '';
        }
        let filterFun = questions[key].filter;
        if (typeof filterFun === 'function') {
          results[key] = filterFun(results) || '';
        } else {
          results[key] = filterFun || '';
        }
        return results;
      }, {});
      print('use slice, ', JSON.stringify(results));
      return results;
    } else {
      return await inquirer.prompt(
        keys.map((key) => {
          const question = questions[key];
          return {
            type: question.type || 'input',
            name: key,
            message: question.desc || question.message || question.description,
            default: question.default,
            filter: question.filter,
            choices: question.choices,
            validate: question.validate,
          }
        })
      );
    }
  }

  async processFiles(targetDir, templateDir) {
    this.log(`process, target: ${targetDir}, template: ${templateDir}`);
    const src = path.join(templateDir, 'template');
    const config = require(templateDir);
    if (config.base) {
      const baseTemplate = path.join(templateDir, config.base);
      await this.processFiles(targetDir, baseTemplate);
    }
    const files = globby.sync('**/*', {
      cwd: src,
      dot: true
    });
    const variables = await this.processVariable(targetDir, templateDir);
    Object.assign(this.variables, variables);
    files.forEach((file) => {
      const from = path.join(src, file);
      const to = path.join(targetDir, this.replaceVariable(file, this.variables));
      const content = fs.readFileSync(from);
      const result = istextorbinary.isTextSync(from, content) ?
        this.replaceVariable(content.toString(), this.variables) : content;
      mkdirp.sync(path.dirname(to));
      fs.writeFileSync(to, result);
    });
  }

  replaceVariable(content, variables) {
    // this.log('content: ', content);
    return content.toString().replace(/(\\)?{{ *(\w+) *}}/g, (block, skip, key) => {
      // this.log(`block: ${block}, skip: ${skip}, key: ${key}`);
      if (skip) {
        return block.substring(skip.length);
      } else {
        return variables.hasOwnProperty(key) ? variables[key] : block;
      }
    });
  }

  parseArgv(argv) {
    return yargs
      .usage('project-create [dir] \n')
      .alias('v', 'version')
      .alias('h', 'help')
      .option(this.getArgsOptions())
      .help()
      .version()
      .parse(argv);
  }

  log(msg, ...opt) {
    console.log(msg, ...opt);
  }

  getArgsOptions() {
    return {
      type: {
        type: 'string',
        default: 'miot',
        description: 'template type',
      },
      template: {
        alias: 't',
        type: 'string',
        description: 'template dir to create project',
      },
      dir: {
        alias: 'd',
        type: 'string',
        description: 'target dir to create project',
      },
      force: {
        alias: 'f',
        type: 'boolean',
        description: 'override exsit target dir',
      },
      silent: {
        alias: 's',
        type: 'boolean',
        description: 'don\'t ask, use default value',
      },
    };
  }
}
module.exports = Command;