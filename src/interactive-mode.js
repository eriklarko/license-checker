// @flow

import fs from 'fs';

import type { ProjectAndLicense } from './report.js';

export function interactiveMode(unapprovedLicenses: Array<ProjectAndLicense>, knownGoodLicenses: Set<string>) {

  if (unapprovedLicenses.length > 0) {

    console.log();
    console.log();
    console.log('Found dependencies using unapproved licenses!');
    const answers = interact('  Accept license ${license} used by ${project}?', unapprovedLicenses);

    if (answers.yes.length > 0) {

      console.log();
      console.log('Approving the following licenses:');
      console.log(answers.yes.join(', '));
    }

    answers.yes.forEach(license => knownGoodLicenses.add(license));
    const toWrite = stringifySet(knownGoodLicenses);
    fs.writeFileSync('./known-good-licenses.json', toWrite);

    if (answers.no.length > 0) {
      console.log();
      console.log('You did not approve the following licenses:');
      console.log(answers.no.join(', '));
      console.log();
      console.log();
      console.log('The license check failed');
      process.exit(3);
    }

  } else {
    console.log('No unapproved licenses');
  }
}

function interact(questionTemplate, deps: Array<ProjectAndLicense>): {
  yes: Array<string>,
  no: Array<string>,
} {
  const answers = {
    yes: [],
    no: [],
  };

  for(let i = 0; i < deps.length; i++) {
    const dep = deps[i];

    const hasSeenLicenseBefore = answers.yes.indexOf(dep.license) >= 0 || answers.no.indexOf(dep.license) >= 0;
    if (hasSeenLicenseBefore) {
      continue;
    }

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
        i--;

        break;
    }
  }

  return answers;
}

function askQuestion(question: string): string {
  process.stdout.write(question + ' [y/n/q/?] ');
  //console.log(question, '[y/n/q/?] ');

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

function stringifySet(set: Set<string>): string {
  const a = [];
  for (const element of set) {
    a.push(element);
  }
  return JSON.stringify(a);
}
