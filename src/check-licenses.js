// @flow

import fs from 'fs';

import { interactiveMode } from './interactive-mode.js';
import { getCurrentLicenses, getKnownGoodLicenses, findUnapprovedLicenses } from './report.js';
import type { ProjectAndLicense } from './report.js';

type Mode = 'non-interactive' | 'interactive' | 'invalid';

const mode = findMode();
if (mode === 'invalid') {
  console.log('USAGE:', process.argv[0], process.argv[1], '[--interactive]');
  process.exit(2);
} else {

  const currentLicenses = getCurrentLicenses();
  const knownGoodLicenses = getKnownGoodLicenses();

  const unapprovedLicenses = findUnapprovedLicenses(currentLicenses, knownGoodLicenses);

  if (mode === 'non-interactive') {
    checkLicenses(unapprovedLicenses, knownGoodLicenses);
  } else if (mode === 'interactive') {
    interactiveMode(unapprovedLicenses, knownGoodLicenses);

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

function checkLicenses(unapprovedLicenses: Array<ProjectAndLicense>, knownGoodLicenses: Set<string> ) {
  console.log();
  console.log();
  console.log('Allowing the following licenses:');
  knownGoodLicenses.forEach(license => console.log(' ', license));

  if (unapprovedLicenses.length > 0) {
    console.log();
    for (const dep of unapprovedLicenses) {
      console.log(dep.project, 'uses the unapproved license', dep.license);
    }

    console.log();
    console.log("The current licenses need to be approved by a human");
    process.exit(1);
  } else {
    console.log('Licenses are valid');
  }
}

