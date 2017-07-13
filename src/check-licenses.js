// @flow

import fs from 'fs';

import { interactiveMode, read_stdinSync } from './interactive-mode.js';
import { getApprovedLicenses, getApprovedProjects, findUnapprovedLicenses } from './report.js';
import { getCurrentLicenses as getCurrentLicensesFromYarn } from './license-finders/yarn.js';
import { APPROVED_PROJECTS_FILE_NAME, APPROVED_LICENSES_FILE_NAME } from './report.js';

import type { ProjectAndLicense } from './report.js';

type Mode = 'non-interactive' | 'interactive' | 'invalid';

const mode = findMode();
if (mode === 'invalid') {
  console.log('USAGE:', process.argv[0], process.argv[1], '[--interactive]');
  process.exit(2);
} else {

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

  if (mode === 'interactive' || shouldForceInteractiveMode()) {
    interactiveMode(unapprovedLicenses, approvedLicenses, approvedProjects);

  } else if (mode === 'non-interactive') {
    checkLicenses(unapprovedLicenses, approvedLicenses);

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

function shouldForceInteractiveMode() {
  const approvedLicensesFileFound = fileExists('./' + APPROVED_LICENSES_FILE_NAME);
  const approvedProjectsFileFound = fileExists('./' + APPROVED_PROJECTS_FILE_NAME);

  const isRunningOnCiServer = require('is-ci');
  const hasInteractiveStdIn = process.stdin && (process.stdin:any).isTTY;
  const seemsToHaveInteractiveShell = !isRunningOnCiServer && hasInteractiveStdIn;

  if (!approvedLicensesFileFound && !approvedProjectsFileFound && seemsToHaveInteractiveShell) {
    console.log();
    return askYesNo('It seems this is the first time you\'re running the license checker!\nYou probably want to approve some of the licenses that your dependencies has.\nDo you want to that now?');
  }
}

function fileExists(file: string): boolean {
  return fs.existsSync(file);
}

function askYesNo(question: string): boolean {
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

function checkLicenses(unapprovedLicenses: Array<ProjectAndLicense>, approvedLicenses: Set<string> ) {
  console.log();
  console.log();
  console.log('Allowing the following licenses:');
  approvedLicenses.forEach(license => console.log(' ', license));

  if (unapprovedLicenses.length > 0) {
    console.log();
    for (const dep of unapprovedLicenses) {
      console.log(dep.project, 'uses the unapproved license', dep.license);
    }

    console.log();
    console.log("The current licenses need to be approved by a human");
    console.log("To do this you run this script (", process.argv[1], ") with the --interactive flag");
    process.exit(1);
  } else {
    console.log('Licenses are valid');
  }
}

