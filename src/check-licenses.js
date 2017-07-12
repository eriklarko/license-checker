// @flow

import fs from 'fs';

import { interactiveMode } from './interactive-mode.js';
import { generateReport, getCurrentLicenses, getKnownGoodLicenses } from './report.js';
import type { Report } from './report.js';

type Mode = 'non-interactive' | 'interactive' | 'invalid';

const mode = findMode();
if (mode === 'invalid') {
  console.log('USAGE:', process.argv[0], process.argv[1], '[--interactive]');
  process.exit(2);
} else {

  const currentLicenses = getCurrentLicenses();
  const knownGoodLicenses = getKnownGoodLicenses();
  const report = generateReport(currentLicenses, knownGoodLicenses);

  if (mode === 'non-interactive') {
    checkLicenses(report);
  } else if (mode === 'interactive') {
    const newApprovedLicenses = interactiveMode(report);

    const toWrite = JSON.stringify(newApprovedLicenses);
    console.log('SAVING', toWrite)
    fs.writeFileSync('known-good-licenses.json', toWrite);
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

function checkLicenses(report: Report) {
  if (report.unapprovedLicenses.length > 0) {
    console.log("The following dependencies have changed licenses:");
    for (const dep of report.unapprovedLicenses) {
      console.log(' ', dep.project, 'uses the unapproved license', dep.currentLicense);
    }

    console.log("The current licenses need to be approved by a human");
    process.exit(1);
  } else {
    console.log('Licenses are valid');
  }

}

function stringifyMap(map: Map<string, string>): string {
  const a = {};
  for(const [key, value] of map) {
    a[key] = value;
  }

  return JSON.stringify(a);
}
