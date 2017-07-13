// @flow

import child_process from 'child_process';

import type { Project, License } from '../report.js';

export function getCurrentLicenses(): Map<Project, License> {
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

