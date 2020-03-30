const yargs = require('yargs');

class Command {
  async run(cwd, argv) {
    this.cwd = cwd;
    const args = this.args = this.parseArgv(argv || []);
    return Promise.resolve(argv);
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
