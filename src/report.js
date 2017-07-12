// @flow

import child_process from 'child_process';
import fs from 'fs';

export type Project = string;
export type License = string;
export type Report = {
  unapprovedLicenses: Array<{
    project: Project,
    currentLicense: License,
  }>,
};

export function generateReport(currentLicenses: Map<Project, License>, knownGoodLicenses: Array<License>): Report {

  const report = {
    unapprovedLicenses: [],
  };

  for (const [project, license] of currentLicenses) {

    const hasKnownGoodLicense = knownGoodLicenses.indexOf(license) >= 0;

    if (!hasKnownGoodLicense) {
      report.unapprovedLicenses.push({
        project: project,
        currentLicense: license,
      });
    }
  }

  return report;
}


export function getKnownGoodLicenses(): Array<string> {
  return readKnownGoodLicensesFile() || [];
}

function readKnownGoodLicensesFile() {
  try {
    console.log('Reading file with known good licenses');
    return require('known-good-licenses.json');
  } catch(e) {
    if (e.message.indexOf('Cannot find') === -1) {
      throw e;
    } else {
      return undefined;
    }
  }
}


export function getCurrentLicenses(): Map<string, string> {
  console.log('Getting the current licenses of all dependencies...');

  const yarnLsOutput = child_process.execSync('yarn licenses ls --json').toString();

  return parseRawOutput(yarnLsOutput);
}

function parseRawOutput(yarnLsOutput): Map<string, string> {
  const rawData = findRawData(yarnLsOutput);
  if (!rawData) {
    return new Map();
  }
  
  return rawData.body.reduce((acc, rawDependency) => {
    const dependency = toInternalRepresentation(rawData.head, rawDependency);
    acc.set(dependency.project, dependency.license);
    return acc;
  }, new Map());
}

function findRawData(yarnLsOutput): ?{head: string, body: Array<string>} {
  for (const lineRaw of yarnLsOutput.split('\n')) {
    if (lineRaw.trim().length === 0) {
      continue;
    }

    const line = JSON.parse(lineRaw);
    if (line.type === 'table') {
      return line.data;
    }
  }

  return undefined;
}

function toInternalRepresentation(head, bodyLine): {project: string, license: string} {
  return {
    project: bodyLine[fieldToIndex(head, 'Name')],
    license: bodyLine[fieldToIndex(head, 'License')],
  };
}

function fieldToIndex(head, fieldToLookFor) {
  for (let i = 0; i < head.length; i++) {
    if (head[i] === fieldToLookFor) {
      return i;
    }
  }

  return -1;
}
