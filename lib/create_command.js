const yargs = require('yargs');
const path = require('path');
const mkdirp = require('mkdirp');
const inquirer = require('inquirer');
const fs = require('fs');

class Command {
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
    const ret = await this.processVariable(this.targetDir, this.templateDir);
    if (!ret) {
      return Promise.reject('process variable failed');
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
        await mkdirp(d);
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
        this.log(`template root dir: ${temp}`);
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
      temp = path.resolve('.', type);
      if (!fs.existsSync(temp)) {
        this.log(`type: ${type} not support.`);
        temp = null;
      }
    }
    return temp;
  }

  async processVariable(targetDir, templateDir) {
    let questions = require(templateDir);
    if(typeof questions === 'function'){
      questions = questions(this);
    }
  }

  async processFiles(targetDir, templateDir) {

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

  log(str) {
    console.log(str);
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