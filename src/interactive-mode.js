// @flow

import fs from 'fs';

import type { Report } from './report.js';

type ProjectAndLicense = {
  project: string,
  license: string,
};

export function interactiveMode(report: Report): Set<string> {

  if (report.unapprovedLicenses.length > 0) {
    const bepa = report.unapprovedLicenses.map(dep => {
      return { project: dep.project, license: dep.currentLicense };
    });

    console.log('The following dependencies have changed license:');
    const answers = interact('  Accept license change of ${project} to  ${license}?', bepa);

    return new Set(answers.yes);

  } else {
    console.log('No dependencies changed license');
  }

  return new Set();
}

function interact(questionTemplate, deps: Array<ProjectAndLicense>): {
  yes: Array<string>,
  no: Array<string>,
} {
  const answers = {
    yes: [],
    no: [],
  };

  for (const dep of deps) {
    const question = questionTemplate
      .replace('${project}', dep.project)
      .replace('${license}', dep.license);


    const ans = askQuestion(question);
    switch (ans) {
      case 'y':
        answers.yes.push(dep.license);
        break;
      case 'n':
        answers.no.push(dep.license);
        break;

      case 'q':
        process.exit(0);

      case '?':
        console.log('y: Yes  - accept the license');
        console.log('n: No   - do not accept the license');
        console.log('q: Quit - stop this sillyness. Nothing will be saved');

        break;
    }
  }

  return answers;
}

function askQuestion(question: string): string {
  //process.stdout.write(question, '[y/n/q/a/?] ');
  console.log(question, '[y/n/q/?] ');

  const ans = read_stdinSync()[0];
  if ('ynq?'.indexOf(ans) < 0) {
    return '?';
  }

  return ans;
}

function read_stdinSync() {
  const BUFFER_LENGTH = 100;

  const stdin = fs.openSync('/dev/stdin', 'rs');
  const buffer = Buffer.alloc(BUFFER_LENGTH);

  const readSync: any = fs.readSync;
  readSync(stdin, buffer, 0, BUFFER_LENGTH);
  fs.closeSync(stdin);

  return buffer.toString();
}
