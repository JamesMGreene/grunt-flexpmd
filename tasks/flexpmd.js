/*
 * grunt-flexpmd
 * https://github.com/JamesMGreene/grunt-flexpmd
 *
 * Copyright (c) 2014 James M. Greene
 * Licensed under the MIT license.
 */

'use strict';

// Node core modules
var fs = require('fs');
var path = require('path');
var os = require('os');
var childProcess = require('child_process');

// Node userland modules
var async = require('async');
var flexPmd = require('flexpmd');
var xpath = require('xpath');
var xmldom = require('xmldom');

function mkdirTmp() {
  return typeof os.tmpdir === 'function' ? os.tmpdir() : os.tmpDir();
}

function safeDelete(path) {
  if (fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
    }
    catch (err) {
      // Swallow it
    }
  }
}

function cleanPriority(priority) {
  // `priority` must be a number or `NaN`
  if (typeof priority !== 'number') {
    priority = parseInt(priority, 10);
  }

  // Auto-correct the value of `priority` to fall within the accepted bounds
  if (isNaN(priority)) {
    priority = 5;
  }
  else if (priority < 1) {
    priority = 1;
  }
  else if (priority > 5) {
    priority = 5;
  }

  return priority;
}


module.exports = function(grunt) {

  var executable = 'java';
  var childArgs = ['-Xmx256m', '-jar', flexPmd.cmd];
  //, '-s', inputDir, '-o', tmpDirBad, '-r', './myCustomRuleset.xml'];


  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('flexpmd', 'A Grunt task plugin for running FlexPMD to lint/analyze apps built on Adobe Flex/ActionScript/MXML/Flash/AIR/etc. Think of it as "ASLint"/"FlexLint".', function() {

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      input:    null,
      output:   null,
      ruleset:  null,
      priority: 5,
      force:    grunt.option('force') || false
    });

    // Auto-correct the value of `priority` to fall within the accepted bounds
    options.priority = cleanPriority(options.priority);

    // Iterate over all specified file groups.
    async.each(this.files, createFilesetProcessor(options), this.async());
  });

  function createFilesetProcessor(options) {
    return function processFileset(f, done) {
      // Clean up the specified source paths
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source dir (if nonull was set).
        if (!grunt.file.isDir(filepath)) {
          grunt.log.warn('Source dir not found: "' + filepath + '"');
          return false;
        } else {
          return true;
        }
      });

      var errMsg;
      if (src.length > 1) {
        errMsg = 'FlexPMD can only accept 1 input source directory but was provided with ' + src.length + '.';
        grunt.fail.warn(errMsg);
        return done(new Error(errMsg));
      }
      else if (src.length < 1) {
        if (options.input) {
          if (!grunt.file.isDir(options.input)) {
            errMsg = 'Source dir not found: "' + options.input + '"';
            grunt.fail.warn(errMsg);
            return done(new Error(errMsg));
          }
        }
        else {
          src.push('./');
        }
      }

      // Clean up the specified destination
      var dest = f.dest || (options.output && grunt.file.expand(options.output)[0]);


      // Check for a custom ruleset
      if (options.ruleset) {
        var rulesetPath = grunt.file.expand(options.ruleset)[0];
        if (!grunt.file.isFile(rulesetPath)) {
          errMsg = 'Custom ruleset not found: "' + rulesetPath + '"';
          grunt.fail.warn(errMsg);
          return done(new Error(errMsg));
        }
        childArgs.push('-r', rulesetPath);
      }

      // Add the source to the command line args
      childArgs.push('-s', src[0]);

      // Create a temporary directory to dump the XML results file
      var tmpDest = mkdirTmp();
      // Add the temporary destination to the command line args
      childArgs.push('-o', tmpDest);

      childProcess.execFile(executable, childArgs, function(err, stdout, stderr) {
        if (stdout) {
          grunt.verbose.write(stdout);
        }
        if (stderr) {
          grunt.verbose.error(stderr);
        }

        if (err) {
          grunt.fail.warn(err);
          return done(err);
        }
        if (/fail|error/.test(stdout.toLowerCase())) {
          errMsg = 'Failures or errors were detected in FlexPMD stdout';
          grunt.fail.warn(errMsg);
          return done(new Error(errMsg));
        }
        if (/fail|error/.test(stderr.toLowerCase())) {
          errMsg = 'Failures or errors were detected in FlexPMD stderr';
          grunt.fail.warn(errMsg);
          return done(new Error(errMsg));
        }

        var outputFile = path.join(tmpDest, 'pmd.xml');
        if (!grunt.file.isFile(outputFile)) {
          errMsg = 'Failed to create FlexPMD report';
          grunt.fail.warn(errMsg);
          return done(new Error(errMsg));
        }

        // Write the destination file.
        if (dest) {
          if (grunt.file.isDir(dest) || !path.extname(path.basename(dest))) {
            dest = path.join(dest, 'pmd.xml');
          }
          var destDir = path.dirname(dest);
          if (!grunt.file.isDir(destDir)) {
            grunt.file.mkdir(destDir);
          }
          grunt.file.copy(outputFile, dest);

          // Print a success message.
          grunt.log.ok('Report created: "' + dest + '"');
        }

        var xml = fs.readFileSync(outputFile, { encoding: 'utf8' });
        var doc = (new xmldom.DOMParser()).parseFromString(xml);
        var violationNodes = xpath.select("//violation", doc);
        if (violationNodes && violationNodes.length > 0) {
          var lastSource = null;
          var hasLoggedError = false;
          violationNodes.forEach(function(violation) {
            // Display the defending file info
            var pkgName = violation.getAttribute('package');
            var className = violation.getAttribute('class');
            var violationSource = className ?
                                    ' class "' + (pkgName ? pkgName + '.' : '') + className + '"' :
                                    (pkgName ? ' package "' + pkgName + '"' : '');
            var msg = 'Linting' + violationSource + ' ...';
            grunt.verbose.write(msg);

            // Only print file name once per error
            if (violationSource !== lastSource) {
              grunt.verbose.or.write(msg);
              hasLoggedError = false;
            }
            lastSource = violationSource;

            // Auto-correct this rule violation's `priority`
            var priority = cleanPriority(violation.getAttribute('priority'));

            // Only report the violation if its priority is higher or equal to the specified `priority` option
            if (priority <= options.priority) {
              if (!hasLoggedError) {
                grunt.log.error();
                hasLoggedError = true;
              }

              // Manually increment errorcount since we're not using `grunt.log.error(...)` below.
              grunt.fail.errorcount++;

              // Show the basics of the violation
              var lineNum = parseInt(violation.getAttribute('beginline'), 10);
              var colNum = parseInt(violation.getAttribute('begincolumn'), 10);
              var pos = '['.red + ('L' + (lineNum < 0 ? 0 : lineNum)).yellow + ':'.red + ('C' + (colNum < 0 ? 0 : colNum)).yellow + ']'.red;
              var reason = violation.childNodes[0].nodeValue;
              grunt.log.writeln(pos + ' ' + reason.yellow);
            }
          });

          errMsg = 'Detected ' + violationNodes.length + ' violations in the FlexPMD report!';
          grunt.log.error().error(errMsg);
          if (options.force) {
            grunt.log.write('Used `force`, continuing anyway...');
            grunt.log.writeln();
            safeDelete(outputFile);
            return done();
          }
          grunt.log.writeln();
          safeDelete(outputFile);
          return done(new Error(errMsg));
        }
        else {
          grunt.log.ok('No violations detected in the FlexPMD report');
        }
        grunt.log.writeln();
        safeDelete(outputFile);
        return done();
      });
    };
  }

};
