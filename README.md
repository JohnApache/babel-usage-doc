# Babel 深入学习与工程实践

## 前言

> 引用babel官方的介绍，Babel是一个工具链，主要用于将ECMAScript 2015+代码转换为当前和旧版浏览器或环境中的向后兼容版本的JavaScript。

> 我自己的理解 babel 其实本质上就是一个js语言的**编译器**，通过将高版本的js语法解析成**ast语法树**，再通过可插拔的插件机制，让每个插件都会对ast语法树做不同的处理，这样的插件集合组成了一个工具链，将js代码编译成向后兼容的JavaScript。

我这里主要整理的是babel-7.5+ 版本的内容
### babel的快速使用 
babel的使用方式 有很多种，常用的 主要有命令行操作和基于配置文件的操作
+   **命令行操作**
    babel支持的命令行参数有很多，这里主要列举几个比较常用的
    + npx babel index.js 没有任何参数的，会编译指定文件并输出到控制台
    + npx babel index.js **--out-file, -o** ./dist/index.js 将babel的输出内容输出到指定的一个文件里, 源文件也可以是一个目录，babel会把目录里的所有js 都打包进 目标文件里
    + npx babel ./src **--out-dir, -d** 将指定的源目录的内容通过babel 编译再输出到指定目标目录里，文件名不变
    + npx babel src --out-dir lib **--copy-files,-D** copyfile 将会复制文件从源目录到目标目录，不经过编译
    + npx babel src --out-dir lib **--ignore** "src/\*.spec.js","src/\*.test.js"，编译的源目录会按照ignore的参数会忽略匹配路经的文件
    + npx babel index.js -o index-c.js **--plugins**=@babel/proposal-class-properties,@babel/transform-modules-amd 插件参数提供了babel编译额外处理功能。所有的源js 的ast树都会通过插件处理
    + npx babel index.js -o index-c.js **--presets**=@babel/preset-env,@babel/flow 预设参数，本质上就是多个插件参数的集合，都会提供babel编译额外处理功能
    + npx babel **--no-babelrc** script.js -o script-compiled.js --presets=react 忽略项目中的.babelrc文件配置只使用cli的配置
    + npx babel **--rootMode=upward** script.js -o script-compiled.js 这个配置会让babel 向上查找babel的全局配置，并确定项目根目录
    使用的完整命令行demo
    ```shell
    npx babel --no-babelrc src -d lib --ignore "*.test.js", "*.spec.js" --presets=@babel/preset-env --plugins=@babel/transform-modules-amd
    ```
+   **通过配置文件**
    关于babel的配置文件详情介绍可以[查看这里](#config_file)
    ```js
    // babel.config.js
    module.exports = {
        babelrc: false,
        presets: [
            'mininfy',
            "@babel/env",
        ],
        plugins: [
            [
                "@babel/plugin-transform-runtime",
                {
                    corejs: 3
                }
            ]
        ],
        ignore: [
            /^.+\.test\.js$/,
            /^.+\.spec\.js$/,
            "./src/test"
        ]
    }
    ```
    通过创建babel.config.js 在项目的根目录，并在项目根目录运行npx babel， 默认操作可以让babel 编译通过这个配置文件编译内容了

### babel的主要模块简介
> babel现在的架构方式，已经将很多功能拆成不同的模块，这里主要介绍的模块 有 @babel/core, @babel/cli, @babel/node, @babel/polyfill, @babel/runtime, @babel/register
+   **@babel/core** 这个是babel的核心库，本质上就是一个解析器，这个库提供了很多api，可以将普通js解析成ast语法树
    ```js
    // @babel/core 使用api用例
    const babel = require('@babel-core');
    babel.transform('code()', (err, result) => {
        const {
            code, // 源代码
            map, // sourcemap
            ast // ast语法树
        } = result;
    });
    ```
    模块详细介绍可查看下面的[babel配置文件详析](#config_file)
    
+   **@babel/cli** 提供babel命令行操作的能力，可以在本地计算机上全局安装babel，不同命令的script入口文件都在@babel/cli/bin, 里面主要提供了babel-cli可执行脚本babel.js 和 工具脚本babel-external-helpers.js,模块详细介绍可查看[@babel/cli介绍](#babel_cli)
    > e.g. npx babel ./src --out-dir dist
+   **@babel/node** 是一个与nodejs cli 完全相同的cli，可以直接在终端中运行执行js代码，相比nodejs，这个模块可以提供额外的babel预设和插件的处理编译，提供了支持es6的repl(read-eval-print-loop)环境，但是对es6 import export 模块加载并不支持,详细介绍可查看[@babel/node介绍](#babel_node)
    > e.g. npx @babel/node -e "class Test { }"
+   **@babel/polyfil** 该软件包实际上已经被弃用了，现在这个包其实就是是 core-js 的别名，它的主要作用就是提供对es高版本浏览器的一个补丁，用来兼容原本一些浏览器不支持的属性和方法，详细使用方法介绍可以查看[@babel/polyfill介绍](#babel_polyfill)
+   **@babel/runtime** 运行时插件，它可以重用那些babel编译时es代码注入的一些polyfill辅助代码，能够节省很大的编译代码体积。详细使用方法介绍可以查看[@babel/runtime](#babel_runtime)。
    > 注意：@babel/runtime 在babel 7.4 版本以前使用的**core-js@2**， 不能支持es新增的实例方法 例如[].instance, 这些实例方法不能通过runtime去polyfill，要完全polyfill的话只能使用preset-enve + useBuiltIns配置。 但是在babel 7.4之后版本，babel提供了**core-js@3**，可以提供runtime 支持实例方法的polyfill。
 
+   **@babel/register** 这个插件提供了babel的另一只使用方式，通过require 钩子将 babel方法绑定到node require模块上，这样所有require的文件都会通过 babel/register进行运行时编译，具体介绍可以查看[@babel/register](#babel_register)。

### 具体使用方法

#### babel的配置文件详析
\<span id="config_file"\> </span\>

###### 配置文件的类型
+ 项目范围的配置（全局配置）
    * babel.config.js
+ 文件相关配置 (局部配置)  
    * .babelrc/.babelrc.js 
    * package.json 带有"babel"属性 
    
###### 项目范围的配置（全局配置）
babel 具有"根"的概念，默认根路径即为当前工作目录(path.resolve(process.cwd(),"babel.config.js"))，对于项目范围的配置，babel默认会搜索根路径下的 **babel.config.js** , 也可以通过npx babel --config-file 修改默认搜索配置文件的路径。
    项目范围的配置与文件配置的物理位置是区分开的，项目范围配置非常适用于统一配置，在同一个工作目录下甚至可以允许插件和预设应用于"node_modules"下的文件。
    
> 注意：node_modules下面的模块一般都是编译好的，所以尽量配置exclude剔除编译过程。如真的必要，可以把个例加到 babelrcRoots中。

##### 文件关联配置(局部配置)  
.babelrc/.babelrc.js/package.json#babel，与babel.config.js不同，它仅适用于当前自己包中的文件，当babel搜索目录的时候遇到package.json 文件 会立即停止。
> 因此文件配置是一个单包的局部配置，除非设置babelrcRoots,否则babel编译的时候会跳过这些非root 的包

#### 配置文件的加载关系
新版本Babel7.x后引入了babe.config.js 配置，与原来的babelrc共存，多个配置的加载关系也变得复杂了许多，下面我们来剖析一下他们的关系。

首先引用官方的一句话，babel7 真正所解决的痛点 [monorepo 类型的项目] ，这个monorepo是一个自造词，它表示的是一个大项目包含很多子项目的一种项目结构。
```js
|- packageA
  |-package.json
  |-.babelrc.js
|- packageB
  |-package.json
  |-.babelrc.js
|- packageC
  |-package.json
  |-.babelrc.js  
|- node_modules
|- config.js
|- babel.config.js
|-.babelrc.js
|- package.json
```

这样的目录结构就是比较典型的monorepo, 因为这个项目有一个根目录，它包含很多子项目或者子包。
这样的目录结构babel是怎么加载的呢？

1. 首先babel会加载根节点的 babel.config.js,这个是一个作用于整个项目甚至node_modules 的babel 配置
2. 全局配置中如果没有配置 babelrcRoots 字段，默认不会加载任何子模块的babelrc配置
3. 如果全局配置里添加了 babelrcRoots: ['.', './packageA', './packageB'];这样的配置，当babel 编译到packageA和packageB,会允许使用当前目录的babelrc配置以及全局配置去编译包里面的内容
4. 根节点的.babelrc 一般不需要，如果配置了的话 ，默认也是可用的

> 综上，我们可以利用babel 7.x的全局配置,配合子项目的.babelrc 配置， 将包含多个子模块的项目很好的编译

> 注意： 这里有一个问题，babel.config.js全局配置是依赖于当前工作目录的。所以当babel的运行环境不 不是在根目录，例如packageA子包编译脚本可能是放在packaageA目录下的一个独立编译，这种情况 packageA 就无法加载到全局babel配置了。针对这种特殊情况，babel 提供了一个可配置命令选项，**--rootMode=upward**, 在子包运行babel的时候可以使用 npx
 babel --rootMode=upward, 这样babel会自动向上寻找全局配置，并确定项目的根目录


#### 总结 配置文件加载逻辑
1. babel.config.js 是全局配置，对整个项目都是有效果的，但是babel的执行环境需要注意，在子模块的babel需要配置rootMode 参数向上查找全局配置
2. .babelrc 是对待编译文件生效的配置，只生效于当前包，另外子模块的babelrc 想加载还需要全局配置 添加 babelrcRoots配置选项
3. node_modules下面的模块一般都是编译好的，除了特殊需要，一般是需要排除编译的，全局配置 exclude 选项


### babel常用配置选项详解
+ ##### babelrc
    参数类型：Boolean
    默认值： true
    当该配置选项为true的时候，允许babel.config.js 加载babelrc 的配置文件，配合babelrcRoots可以加载子包的babel配置，当为false的时候就完全禁止加载babelrc配置，整个项目只会有babel.config.js 全局配置
+ ##### babelrcRoots 
    参数类型：boolean | MatchPattern | Array<MatchPattern>
    默认参数 opts.root
    babel默认只会使用项目根节点的.babelrc 配置文件，如果需要使用子包的.babelrc 可以配置该参数允许加载子包的
+ ##### root
    参数类型：String
    默认值：process.cwd();
    用来确定当前babel执行环境的的根目录位置，默认就是项目的根目录
+ ##### rootMode
    参数类型："root" | "upward" | "upward-optional"
    默认： "root"
    这个配置选项，和root 配置选项是关联的，定义了babel如何选择项目的根目录，通过传入不同参数可以选择babel 不同的处理root值，以获得最终项目的根目录
    - "root" 传递原root值不变
    - "upward" 让babel从root的上级目录查找babel.config.js全局配置，如果没有会报错
    - "upward-optional" 让babel从root的上级目录查找babel.config.js ,如果没有找到就回退到当前目录作为babel的根目录
    > 当babel构建的项目是monorepo结构的项目，需要基于每个子包运行构建测试的时候，babel的执行环境在子包的环境，并没有babel.config.js 全局配置，这个时候可以加入roomMode: 'upward'参数，让babel 从root上一级找全局配置合并当前babelrc的配置来构建当前项目目录的内容
+ ##### plugins
    参数类型： Array<String | [String, Options]>
    默认值：[]
    该选项配置包含了，当babel启动的时候要激活的babel插件数组
+ ##### presets 
    参数类型： Array<String | [String, Options]>
    默认值：[]
    预设本质就是插件的集合，该配置表示babel处理文件要激活的预设插件数组.
    
+ ##### extends
    参数类型：String
    该选项参数不能放置在presets选项配置上.
    该选项允许继承其他配置文件的配置，extends 选项在当前配置文件配置范围将会合并继承extends指向的配置文件的相同配置范围的配置内容，当前配置文件覆盖在继承文件配置之上
+ ##### overrides
    参数类型：Array<Options>
    该选项参数不允许放置在嵌套的overrides配置和env配置里.
    该选项参数允许用户提供一个覆盖当前配置文件的配置内容的配置数组.使用实例
    ```js
    module.exports = {
        overrides: [{
            exclude: [
                './lib/*',
                './utils/*'
            ],
            test: /^.+\.js$/,
            compact: true,
        }]
    };
    ```
    此功能经常配置 "test", "include", "exclude" 选项一起使用，可以提供babel覆盖当前全局配置的条件
    
    
 + ##### envName
    参数类型 String
    默认值 process.env.BABEL_ENV || process.env.NODE_ENV || "development"
    只允许在babel 编程选项中使用，不允许手动配置。
    该选项配置可以配合 env选项配置参数，允许babel在加载配置期间process.env.BABEL_ENV指向babel的环境变量，通过不同的环境变量 让babel 加载不同环境下的配置文件，该选项也可以 通过 **api.env()** 功能在 配置函数，插件和预设中使用
 
+ ##### env
    参数类型：{ [envKey: string]: Options }
    该配置不允许放置在另一个env 配置块里面使用
    该配置配合babelName环境变量 允许babel在不同环境变量下加载不同配置，envKey 指向的就是envName 所代表的值
    > 注意：env[envKey] 的配置选项只会合并在当前babel根配置对象指定的选项上
    ```js
    module.exports = {
        presets: [
            "@babel/env"
        ],
        development: {
            exclude: [ 
                './lib/**'
            ]
        },
        production: {
            include: [
                'node_modules/**'
            ],
            presets: [
                "minify"
            ],
            plugins: [
                "@babel/plugin-transform-runtime"
            ]
        }
    }
    ```
+ ##### test
    参数类型：MatchPattern | Array<MatchPattern>
    该选项配置是一个匹配规则或者规则列表，如果babel当前编译的文件和配置规则都不符合，则babel编译的时候会将该文件忽略，该选项经常配合overrides 一起使用，让babel 做配置文件条件输出，而且该选项可以放在配置文件的任何位置
+ ##### include
    该选项配置是"test"选项的的别名
+ ##### exclude    
    参数类型：MatchPattern | Array<MatchPattern>
    与 include 配置相反，该配置表示的是当任意一个的匹配规则列表符合匹配当前编译文件的，babel 都会忽略该文件，该选项经常配合overrides 一起使用，让babel 做配置文件条件输出，而且该选项还可以放在配置文件的任何位置
    > 注意：test/include/exclude 配置文件会在babel准备合并配置之前就预先考虑到 test选项，所以在babel 切换不同的配置文件加载选项的时候，该选项已经被提前设置好了
+ ##### ignore
    参数类型：Array<MatchPattern>
    该选项参数不允许放置在"presets"配置内
    功能与"exclude"类似，当babel编译的时候匹配到任意符合匹配规则列表的内容时，会立即中止当前所有的babel处理。完全禁用babel的其他处理
+ ##### only
    参数类型：Array<MatchPattern>
    该选项参数不允许放置在"presets"配置内
    功能与 test/include 相似，明确让babel 只编译 匹配规则列表的内容，禁用其他所有文件的内容处理
+ ##### sourceMaps / sourceMap
    参数类型：boolean | "inline" | "both"
    默认值：false
    babel创建sourceMap，
        + true 为编译文件创建一个sourceMap
        + inline 将map作为 data:url直接内嵌到文件里
        + both 既创建map 也内嵌
    注意：该配置选项我自己实验的时候 只能在命令行中使用，在配置文件里配置无效,而@babel/cli 会将map写入到 **.map**后缀的格式文件内    

+ ##### sourceType
    参数类型："script" | "module" | "unambiguous"
    默认值："module" 
    该选项配置参数主要引导babel的文件解析是否转换import或者require，babel默认处理模块是es模块，默认使用import
    + script 使用ECMAScript Script语法解析文件。不允许import/ export语句，文件不是严格模式。
    + module 使用ECMAScript Module语法解析文件。并且允许import/ export语句，文件是严格模式。
    + unambiguous 如果当前文件有import/export 则视为"module"， 否则将视为 "script"
    unambiguous在类型未知的上下文中非常有用，但它可能导致错误匹配，因为module文件可能并没有使用import/ export 语法。
+ ##### compact
    参数类型：Boolean | "auto"
    默认值："auto"
    该配置选项引导babel是否开启紧凑模式，紧凑模式会省略所有可选的换行符和空格.
    当配置选项是”auto“的时候，babel会根据文件的字符数判断，当字符长度 code.length > 50,000 时 会开启紧凑模式
    
+ ##### minified  
    参数类型：Boolean
    默认值：false
    该配置选项为ture的时候， 相当于compact:true 基础上,还省略了块级作用域末尾的分号，以及其他很多地方省略，babel尽可能的压缩代码，比compact更短的输出
    
+ ##### comments
    参数类型：Boolean
    默认值：true
    **shouldPrintComment** 配置选项如果没有给出相应的注释函数，则提供默认的注释状态，当为false的时候就不展示注释
+ ##### shouldPrintComment
    Type: (value: string) => boolean
Default without minified: (val) => opts.comments || /@license|@preserve/.test(val)
Default with minified: () => opts.comments
    该选项配置参数，是一个函数，可以让babel决定是否以怎样的规则展示注释
    > 综上，可以判断出，预设插件babel-preset-minify的压缩效果其实等价于 配置 minified: true + commments: false   
    ```js
    module.exports = {
        presets: [
            'minify', //预设插件
        ],
        comments: false,
        minified: true, 
        // {
        //    minified: true,
        //    commments: false
        // } === babel-preset-minify
    }
    ```
    当忽略处理node_modules目录时，minify插件或者minfied配置都对node_modules目录引入的东西不会压缩，实际上一般也建议压缩这一操作应该放在工程操作的最外层，例如webpack层 或者rollup层去压缩代码
### polyfill详解  
> @babel-polyfill 在7.4版本的时候就已经被弃用了，分化成 corejs + regenerator-runtime，现在的@babel/polyfill 只是corejs2的一个别名. 但是我这里主要讲要介绍这个包的应用，而是如何利用 babel 配置 polyfill ECMAScript，让我们可以在开发中使用很多新的功能，实例，静态方法等
+ 使用@babel/presets-env 预设 + useBuiltIns + corejs选项，
    ```js
    module.exports = {
        presets: [
            [
                '@babel/preset-env',
                {
                    useBuiltIns: 'usage', // 'usage', ‘entry’, false
                    corejs: 3
                }
            ]
        ]
    }
    ```
    需要注意的有几点
    
    + 当useBuiltIns有配置的时候，corejs选项必须设置，我这里安装的是core-js@3所以配置成3 ，如果安装的是@babel/polyfill或者core-js@2 ，corejs 选项就是2
    + useBuiltIns 选项为entry的时候,在入口文件顶部引入@babel/polyfill,或者 core-js ,babel会自动将所有的polyfill加载进来，非常鸡肋的功能。。
    + useBuiltIns 选项为usage的时候，就不需要在入口文件引入 @babel/polyfill,或者 core-js,引用 也会被babel删除，并在控制台打出警告。usage会按需只加载文件中用到的polyfill，
    + useBuiltIns 配置是覆盖polyfill，会污染全局的polyfill，如果不想污染全局，可以使用transform-runtime插件，当使用corejs@2 或者 @babel/polyfill ，将不能支持实例方法的 polyfill，例如[].includes(),不过在core-js@3版本 已经可以支持了
    
### transform-runtime 运行时详解
这里主要需要介绍的插件就是@babel/plugin-transform-runtime,这是一个辅助程序，帮助babel重复使用在babel编译时polyfill注入的helper程序代码。和useBuiltInstd的polyfill最大的不同是，它不会污染全局变量。
> 注意：针对于实例方法的例如 [].includes()，只能通过@babel/runtime-corejs3,进行运行时polyfill，或者单独引入corejs或者使用useBuiltIns选项以替代，运行时polyfill。
+ 安装方法
```shell
npm install @babel/plugin-transform-runtime --save-dev
npm install @babel/runtime-corejs3 --save
```
```js
module.exports = {
    presets: [
        '@babel/env'
    ],
    plugins: [
        [
            '@babel/plugin-transform-runtime',
            {
                corejs: 3
            }
        ]
    ]
}
```
> 需要注意的有以下几点
+ transform-runtime运行时插件是依赖于 @babel/runtime插件的，这里的运行时插件配置选项corejs为3 ，所以需要安装@babael/runtime-corejs3在生产依赖中。
+ 插件@babel/plugin-transform-runtime 通常和预设 @babel/preset-env 并存的，当配置运行时插件的时候，预设preset-env就不需要配置useBuiltIns选项了

#### @babel/plugin-transform-runtime的常用可配置参数详解
+ **corejs**
参数类型：false | 2 | 3 | { version: 2 | 3, proposals: Boolean }
默认值：false
该配置选项的主要作用就是让插件决定使用什么corejs版本作运行时polyfill。
    > 需要注意的几点
    + 当corejs等于 2 的时候 或者 对象形式version 为2 的时候，仅支持全局变量(Map,Promise)和静态属性(Array.from())的polyfill。
    + 当corejs等于 3 的时候还可以支持实例属性([].includes())的polyfill。
    + 默认情况下 该插件不会polyfill还在提案中的方法，如果你想支持提案方法的polyfill, 需要添加corejs: {version:3, proposals: true},
    + 针对不同的corejs配置还需要安装不同的 @babel/runtime 插件来支持运行时polyfill
        - corejs: false 需要 npm install @babel/runtime --save
        - corejs: 2 需要 npm install @babel/runtime-corejs2 --save
            - corejs: 3 需要 npm install @babel/runtime-corejs3 --save

+ **helpers**
参数类型：Boolean
默认值：true
该配置参数让运行时插件决定，当调用模块的时候是否需要生产辅助程序代码(classCallCheck, extends, etc.) 替换helpers。
不建议修改此参数，通常Babel会在文件顶部放置帮助程序来执行常见任务，以避免在当前文件中复制代码，运行时插件就是通过该配置，可以重复使用相同模块的代码

+ **regenerator**
参数类型：Boolean
默认值：true
该配置参数让插件决定polyfill的代码，是否生成不会污染全局变量的函数。不建议修改此参数

+ **useESModules**
参数类型：Boolean
默认值：false
当为true的时候 该配置选项就不会运行@babel/plugin-transform-modules-commonjs，将ES6代码转化为commonjs,.(不是很清楚这个配置参数有什么用，默认为false即可以)

### 细节配置问题
+ **presets预设列表和plugins插件列表的执行顺序**
    
    - 插件plugins的运行时机是在 预设 presets 之前的
    - 插件plugins列表的运行顺序是正序的，即从第一个到结尾依次执行
    - presets预设列表的运行时机相反，倒叙执行，babel时从最后一个执行到第一个
    
+ **presets和plugins的字符串命名问题**
    - presets 预设值是一个数组，数组的具体预设项命名规范是 babel-preset-[name], 这种包名称可以使用简写，babel 会自动从node_modules目录里寻找该插件，这个值也可以缩写为babel/preset-[name] => [name]. 它也可以适用于范围包 @babel/babel-preset-[name] => @babel/[name],  e.g.
        ```js
        module.exports = {
            presets: [
                'minify', // === 'babel-preset-minify'
                '@babel/env', // === '@babel/babel-preset-env',
                [
                    '@babel/babel-preset-react', // === @babel/react
                ]
            ]
        }
        ```
    - plugins 插件值也是一个数组，他的命名规范同presets相同，只是preset替换成plugin而已。e.g.
        ```js
         module.exports = {
            plugins: [
                'myPlugin', // === 'babel-plugin-myPlugin'
                '@babel/myPlugin', // === '@babel/babel-plugin-myPlugin',同样适用于范围包
            ]
        }
        ```


## 工程实践

### Rollup + Babel 工程实践
这里rollup使用的是1.19.x版本
+ **安装依赖**
    - 安装rollup
    ```shell
    npm install rollup -D 
    ```
    - 安装rollup插件 rollup-plugin-node-resolve, rollup-plugin-commonjs, rollup-plugin-babel
    ```shell
    npm install rollup-plugin-node-resolve rollup-plugin-commonjs rollup-plugin-babel -D 
    ```
    - 安装babel
    ```shell
    npm install @babel/core @babel/cli -D
    ```
    - 安装babel相关预设，@babel/preset 插件@babel/plugin-transform-runtime 以及@babel/runtime-corejs3 生产环境依赖
    ```shell
    npm install @babel/preset @babel/plugin-transform-runtime -D
    npm install @babel/runtime-corejs3 -S
    ```
+ **构建配置**

    - 根目录创建rollup.config.js
    ```js
    // rollup.config.js
    // rollup 支持es语法
    import path from 'path';
    import commonjs from 'rollup-plugin-commonjs';
    import resolve from 'rollup-plugin-node-resolve';
    import babel from 'rollup-plugin-babel';
    export default {
        input: path.resolve(__dirname, './src', 'index.js'),
        plugins: [
            resolve(),
            commonjs({
                include: 'node_modules/**', 
                exclude: [],
            }),
            babel({
                runtimeHelpers: true // 这个配置一定要设置，否则不能启用运行时 polyfill 插件，
                // 配置建议外置 其他配置放在babel.config.js内配置
            })
        ],
        output: {
             dir: path.resolve(__dirname, 'dist/'),
            format: 'cjs',
        }
    }
    ```
    根目录创建babel.config.js
    ```js
    // babel.config.js
    // babel 不支持es语法
    module.exports = {
        presets: [
            '@babel/env'
        ],
        plugins: [
            [
                '@babel/plugin-transform-runtime', 
                {
                    corejs: 3
                }
            ]
        ],
        ignore: [
            'node_modules/**'
        ]
    }
    ```
    其他rollup具体配置可以参考 [rollup使用教程](https://github.com/JohnApache/rollup-usage-doc)
+ 运行命令
```shell
npx rollup -c
```
### Gulp + Babel 工程实践
这里使用的gulp 4.x版本，新增了series parallel等api
+ 安装依赖
    - 安装gulp
    ```shell
    npm install gulp --save-dev
    ```
    - 安装gulp工程需要的插件gulp-babel gulp-uglify del等的
    ```shell
    npm install gulp-babel gulp-uglify del --save-dev
    ```
    - 安装babel
    ```shell
    npm install @babel/core @babel/cli -D
    ```
    - 安装babel相关预设，@babel/preset 插件@babel/plugin-transform-runtime 以及@babel/runtime-corejs3 生产环境依赖
    ```shell
    npm install @babel/preset @babel/plugin-transform-runtime -D
    npm install @babel/runtime-corejs3 -S
    ```
    - 安装@babel/register 使得gulpfile可以用import/export语法
    ```shell
    npm install @babel/register
    ```
+ 构建配置
    - 因为使用的@babel/register，替换原本的gulpfile.js，在根目录创建创建 gulpfile.babel.js

    ```js
    // gulpfile.babel.js
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
        return gulp.src(paths.scripts.src, {
            sourcemaps: true 
        }).pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.dest));
    }

    const build = gulp.series(
        clean, 
        gulp.parallel(scripts)
    );

    export default build;
    ```
    - 根目录创建babel.config.js
    ```js
    const presets = [
        '@babel/env',
    ];

    const plugins = [
        [
            '@babel/plugin-transform-runtime',
            {
                corejs: 3,
            }
        ]
    ];

    const ignore = [
        'node_modules/**'
    ];

    module.exports = {
        presets,
        plugins,
        ignore,
    }
    ```
+ 运行命令
```shell
npx gulp
```

### Webpack + Babel 工程实践
+ 安装依赖
    - 安装webpack 
    ```shell
    npm install webpack webpakc-cli -D
    ```
    - 安装webpack babel插件 babel-loader
    ```js
    npm install babel-loader -D
    ```
    - 安装babel
    ```shell
    npm install @babel/core @babel/cli -D
    ```
    - 安装babel相关预设，@babel/preset 插件@babel/plugin-transform-runtime 以及@babel/runtime-corejs3 生产环境依赖
    ```shell
    npm install @babel/preset @babel/plugin-transform-runtime -D
    npm install @babel/runtime-corejs3 -S
    ```
+ 构建配置
    - 根目录创建webpack.config.js
    ```js
    const path = require('path');

    module.exports = {
      mode: 'production',  
      entry: './src/index.js',
      output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
      },
      module: {
        rules: [
            {
              test: /\.m?js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader',
                // options: {
                //   presets: ['@babel/preset-env'],
                //   plugins: ['@babel/plugin-transform-runtime']
                // } 配置可以放在外面 也可以放在里面
              }
            }
          ]
      }
    };
    ```
    
    - 根目录创建babel.config.js，如果babel配置写在webpack里面，就可以省略创建 该配置文件
    ```js
    const presets = [
        '@babel/env',
    ];

    const plugins = [
        [
            '@babel/plugin-transform-runtime',
            {
                corejs: 3,
            }
        ]
    ];

    const ignore = [
        'node_modules/**'
    ];

    module.exports = {
        presets,
        plugins,
        ignore,
    }
    ```
+ 运行命令
```shell
npx webpack
```

## 总结
以上就是全部我自己对babel的内容的一个大的整理

### Todo
+ babel插件开发
+ babel预设开发