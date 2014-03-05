# grunt-flexpmd

> A Grunt task plugin for running FlexPMD to lint/analyze apps built on Adobe Flex/ActionScript/MXML/Flash/AIR/etc.
Think of it as "ASLint"/"FlexLint".


## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-flexpmd --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-flexpmd');
```

## External Dependencies
While this Node/NPM module does not have any external dependencies itself, the underlying FlexPMD tool requires Java.


## The "flexpmd" task

### Overview
In your project's Gruntfile, add a section named `flexpmd` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  flexpmd: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.input
Type: `String`
Default value: `null`

A string value that is used as the single input directory.
If a [single] "src" directory is configured, it will override this `input` option.


#### options.output
Type: `String`
Default value: `null`

A string value that is used as the output directory in which to write the results file (named "pmd.xml" by default).
If a "dest" file is configured, it will override this `output` option.


#### options.ruleset
Type: `String`
Default value: `null`

A string value that is used as the path to the FlexPMD ruleset.
If no ruleset is specified, it will use the default FlexPMD ruleset.


#### options.priority
Type: `Number`
Default value: `5`

An integer value 1-5 (where 1 is the highest priority and 5 is the least) that indicates the minimum
violation priority at which to fail the task. For example, if a single priority level `5` violation
exists but you have configured `options.priority` to be `3`, the task will not fail.

Note that if you are also generating an XML report file, the report file will contain **ALL** violations
rather than being filtered down based on this priority setting. _(If you think this is a silly design choice,
please [open a new issue](https://github.com/JamesMGreene/grunt-flexpmd/issues/new) to discuss it.)_


#### options.force
Type: `Boolean`
Default value: `false`

A Boolean value that indicates if the task should succeed even if there are analysis violations.
This is probably most useful if you want to generate an [XML analysis report](#XML-Report-Example) for
informational purposes but without impacting build status.


### Usage Examples

#### Basic Example

The following example configuration will run the default FlexPMD ruleset over all files in the "src/" directory.

```js
grunt.initConfig({
  flexpmd: {
    example1: ['src/']
  }
});
```


#### XML Report Example

The following example configuration will run the default FlexPMD ruleset over all files in the "src/" directory and
create a report file called "flexlint.xml" in the "reports/" directory. The task will pass even if there are violations
because of the `force: true` option.

```js
grunt.initConfig({
  flexpmd: {
    example2: {
      options: {
        force: true
      },
      'reports/flexlint.xml': ['src/']
    }
  }
});
```

#### Custom Ruleset Example

The following example configuration will run a custom FlexPMD ruleset over all files in the "src/" directory and
create a report file called "pmd.xml" in the "reports/" directory. The task _will_ fail if there are violations
of priority level 3 or higher (1-3).

```js
grunt.initConfig({
  flexpmd: {
    options: {
      input: 'src/',
      output: 'reports/',
      priority: 3
    },
    example3: {
      options: {
        ruleset: 'config/myCustomRuleset.xml'
      }
    }
  }
});
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code using [Grunt](http://gruntjs.com/).


## Release History
 - 0.1.0: Published to NPM on 2014-03-05.
    - Initial release.


## Background Information on FlexPMD
 - [Home](http://sourceforge.net/adobe/flexpmd/)
 - [Overview](http://sourceforge.net/adobe/flexpmd/wiki/Overview/)
 - [About](http://sourceforge.net/adobe/flexpmd/wiki/About/)
 - [How to invoke FlexPMD](http://sourceforge.net/adobe/flexpmd/wiki/How%20to%20invoke%20FlexPMD/)
 - [How to interpret FlexPMD results](http://sourceforge.net/adobe/flexpmd/wiki/How%20to%20interpret%20results/)
 - [How to add your own rule](http://sourceforge.net/adobe/flexpmd/wiki/How%20to%20add%20your%20own%20rule/)
 - [Developer documentation](http://sourceforge.net/adobe/flexpmd/wiki/Developer%20documentation/)
 - [Mind Map: "What is FlexPMD?"](http://www.xmind.net/m/F2Ft/)
 - [FlashDevelop4's integrated FlexPMD source folder](http://flashdevelop.googlecode.com/svn/trunk/FD4/FlashDevelop/Bin/Debug/Tools/flexpmd/) _(&rarr; Tools &rarr; Flash Tools &rarr; Analyse Project Source code.)_
 - [FlashDevelop3's FlexPMD plugin wrapper and usage discussion](http://www.flashdevelop.org/community/viewtopic.php?f=4&t=5403)
 - [FlashDevelop3's FlexPMD plugin wrapper setup guide](http://www.swfgeek.net/2009/09/18/using-flex-pmd-in-flashdevelop-3/)
 