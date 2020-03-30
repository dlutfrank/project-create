const yargs = require('yargs');
const path = require('path');
const fs = require('fs');

class Command {
  async run(cwd, argv) {
    this.cwd = cwd;
    this.args = this.parseArgv(argv || []);
    this.targetDir = await this.getTargetDir();
    this.templateDir = await this.getTemplateDir();
    return Promise.resolve(argv);
  }

  async getTargetDir() {
    const { force, silent } = this.args;
    const dir = this.args._[0] || this.args.dir || '';
    
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
