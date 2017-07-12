// @flow

import child_process from 'child_process';
import fs from 'fs';

export type Project = string;
export type License = string;
export type ProjectAndLicense = {
  project: Project,
  license: License,
};

export function findUnapprovedLicenses(currentLicenses: Map<Project, License>, knownGoodLicenses: Set<License>): Array<ProjectAndLicense> {

  const unapprovedLicenses = [];

  for (const [project, license] of currentLicenses) {

    const hasKnownGoodLicense = knownGoodLicenses.has(license);

    if (!hasKnownGoodLicense) {
      unapprovedLicenses.push({
        project: project,
        license: license,
      });
    }
  }

  return unapprovedLicenses;
}


export function getKnownGoodLicenses(): Set<License> {
  return new Set(readKnownGoodLicensesFile());
}

function readKnownGoodLicensesFile() {
  try {
    console.log('Reading file with known good licenses...');
    return JSON.parse(fs.readFileSync('./known-good-licenses.json', 'utf8'));
  } catch(e) {
    if (e.message.indexOf('ENOENT') === 0) {
      return undefined;
    } else {
      throw e;
    }
  }
}


export function getCurrentLicenses(): Map<Project, License> {
  console.log('Getting the current licenses of all dependencies...');

  const yarnLsOutput = child_process.execSync('yarn licenses ls --json').toString();

  return parseRawOutput(yarnLsOutput);
}

function parseRawOutput(yarnLsOutput): Map<Project, License> {
  const rawData = findRawData(yarnLsOutput);
  if (!rawData) {
    return new Map();
  }
  
  return rawData.body.reduce((acc, rawDependency) => {
    const dependency = parseProjectAndLicense(rawData.head, rawDependency);
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

function parseProjectAndLicense(head, bodyLine): {project: Project, license: License} {
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
