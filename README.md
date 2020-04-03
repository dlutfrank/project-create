### project-create
通过模板创建工程

#### 安装
推荐全局安装project-create
```
$ npm i project-create -g
$ project-create -h
```

#### 创建内置的miot工程

```
$ project-create [dir]
```

#### 通过模板创建工程
```
$ project-create [dir] -t path/to/template
```

#### 命令参数
```
Options:
  --type          内置模板，目前仅支持miot                         [字符串] [默认值: "miot"]
  --template, -t  创建工程的模板路径，相对路径                       [字符串]
  --dir, -d       创建工程的目标文件夹，相对路径                     [字符串]
  --force, -f     如果目标文件夹存在，是否覆盖                       [布尔]
  --silent, -s    非交互式创建工程                                 [布尔]
  -v, --version   显示版本号                                      [布尔]
  -h, --help      显示帮助信息                                     [布尔]
```

不询问，使用默认值创建：
```
$ project-create [dir] -s
```

如果目标文件夹存在，则覆盖：
```
$ project-create [dir] -f
```

#### 模板结构

模板可以参考lib/miot

```
.
├── index.js
└── template
    ├── build
    ├── index.ios.js
    ├── index.js
    ├── package.json
    ├── project.json
    └── res
```
每个模板工程由根目录下的index.js文件和里面的template文件夹构成。
index.js中导出需要替换的变量和父模板名，这些可替换变量可以被template中的文件所使用。
template中存放模板工程所需要的文件。

例如：

```js
// index.js
module.exports = {
  repalce: {
    models: {
      description: 'model of device',
      default: 'zhimi.demo.model',
    },
    name: {
      desc: 'project name',
    },
    pwd: {
      type: 'password',
    }
  },
  base: null,
}

```
这里导出了models的变量，在文件中可以这样使用:
```js
// template/project.json
{
  "models": "{{ models }}",
}
```
所有使用了`"{{ modles }}"`的地方，都会替换成通过交互输入的modles，如果不指定，则会替换为默认的`zhimi.demo.model`。当然也可以通过转义来取消替换，`\{{ models }}`将会按照原样输出，不会替换变量。

`base`指定了模板工程的父模板工程，如果存在父模板工程，则会先拷贝父模板工程的项目到目标文件夹，子模板中的文件将会对父模板中同名的文件进行覆盖。

#### 模板工程导出变量可选项

+ type:(String)，默认为input，可选参数为input、password、number、list
+ desc:(String|Function)，提示语，交互输入时候的提示
+ default:(String|Number|Boolean|Function)，变量值的默认值
+ validate:(Function)，校验函数，校验输入值是否合法
+ filter:(Function)，过滤函数，过滤输入

