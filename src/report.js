// @flow

import fs from 'fs';

export const APPROVED_LICENSES_FILE_NAME = 'approved-licenses.json';
export const APPROVED_PROJECTS_FILE_NAME = 'approved-projects.json';

export type Project = string;
export type License = string;
export type ProjectAndLicense = {
  project: Project,
  license: License,
};

export function findUnapprovedLicenses(
  currentLicenses: Map<Project, License>,
  approvedLicenses: Set<License>,
  approvedProjects: Map<Project, License>,
): Array<ProjectAndLicense> {

  const unapprovedLicenses = [];

  for (const [project, license] of currentLicenses) {

    const hasApprovedLicense = approvedLicenses.has(license);
    const projectIsManuallyApproved = approvedProjects.get(project) === license;

    if (!hasApprovedLicense && !projectIsManuallyApproved) {
      unapprovedLicenses.push({
        project: project,
        license: license,
      });
    }
  }

  return unapprovedLicenses;
}


export function getApprovedLicenses(): Set<License> {
  return new Set(readFile('./' + APPROVED_LICENSES_FILE_NAME));
}

function readFile(file: string) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch(e) {
    if (e.message.indexOf('ENOENT') === 0) {
      return undefined;
    } else {
      throw e;
    }
  }
}


export function getApprovedProjects(): Map<Project, License> {
  const obj = readFile('./' + APPROVED_PROJECTS_FILE_NAME) || {};
  const map = new Map();
  for (const key of Object.keys(obj)) {
    map.set(key, obj[key]);
  }

  return map;
}
