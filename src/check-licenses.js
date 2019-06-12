// @flow

import fs from 'fs';

import { interactiveMode, read_stdinSync } from './interactive-mode.js';
import { nonInteractiveMode } from './non-interactive-mode.js';
import { getApprovedLicenses, getApprovedProjects, findUnapprovedLicenses } from './report.js';
import { getCurrentLicenses as getCurrentLicensesFromYarn } from './license-finders/yarn.js';
import { APPROVED_PROJECTS_FILE_NAME, APPROVED_LICENSES_FILE_NAME } from './report.js';

import type { ProjectAndLicense } from './report.js';

type Mode = 'non-interactive' | 'interactive' | 'invalid';

let mode = findMode();
if (mode === 'invalid') {
  console.log('USAGE:', process.argv[0], process.argv[1], '[--interactive]');
  process.exit(2);
} else {

  // TODO: build some config thing to specify where the list comes from
  console.log('Getting the current licenses of all dependencies...');
  const currentLicenses = getCurrentLicensesFromYarn();

  console.log('Reading file with approved licenses...');
  const approvedLicenses = getApprovedLicenses();

  console.log('Reading file with approved projects...');
  const approvedProjects = getApprovedProjects();

  const unapprovedLicenses = findUnapprovedLicenses(
    currentLicenses,
    approvedLicenses,
    approvedProjects
  );

  if (!appearsConfigured() && mode !== 'interactive') {
    // if no config is given the whole program is kinda useless so
    // we want to hint to the user that they need to run in interactively
    // first
    if (hasInteractiveShell()) {
      console.log();
      console.log('It appears I\'m not configured!');
      if (askYesNo('Do you want to configure me now?')) {
        mode = 'interactive';
      } else {
        console.log('Cool cool. You can run me with the --interactive flag to configure me later');
        process.exit(0);
      }
    } else {
      console.log('I\'m not configured :cry:. Run me with the --interactive flag to configure me');
      process.exit(1);
    }
  }

  if (mode === 'interactive') {
    interactiveMode(unapprovedLicenses, approvedLicenses, approvedProjects);

  } else if (mode === 'non-interactive') {
    nonInteractiveMode(unapprovedLicenses, approvedLicenses, approvedProjects);

  }
}

function findMode(): Mode {
  if (process.argv.length === 2) {
    // The script was run without any arguments.
    // 0 is the path to node, 1 is the path to this script

    return 'non-interactive';
  } else if (process.argv.length === 3 && process.argv[2] === '--interactive') {

    return 'interactive';
  } else {

    return 'invalid';
  }
}

export function hasInteractiveShell() {
  const isRunningOnCiServer = require('is-ci');
  const hasInteractiveStdIn = process.stdin && (process.stdin:any).isTTY;

  return !isRunningOnCiServer && hasInteractiveStdIn;
}

export function appearsConfigured() {
  const approvedLicensesFileFound = fileExists('./' + APPROVED_LICENSES_FILE_NAME);
  const approvedProjectsFileFound = fileExists('./' + APPROVED_PROJECTS_FILE_NAME);

  return approvedLicensesFileFound && approvedProjectsFileFound;
}

function fileExists(file: string): boolean {
  return fs.existsSync(file);
}

export function askYesNo(question: string): boolean {
  for(;;) {
    process.stdout.write(question + " [Y/n] ");
    let ans = read_stdinSync()[0].trim();
    if (ans.length === 0) {
      ans = 'y';
    }

    ans = ans.toLowerCase();
    if ('yn'.indexOf(ans) >= 0) {
      return ans === 'y';
    }
  }

  return false;
}

