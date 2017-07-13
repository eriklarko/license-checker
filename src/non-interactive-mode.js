// @flow

import type { ProjectAndLicense } from './report.js';

export function nonInteractiveMode(
  unapprovedLicenses: Array<ProjectAndLicense>,
  approvedLicenses: Set<string>,
  approvedProjects: Map<string, string>,
) {
  console.log();
  console.log();
  console.log('Allowing the following licenses:');
  approvedLicenses.forEach(license => console.log(' ', license));

  console.log();
  console.log('Allowing the following project and license combos:');
  approvedProjects.forEach((lic, proj) => console.log('  ', proj, ' - ', lic));

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

