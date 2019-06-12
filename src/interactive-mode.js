// @flow

import fs from 'fs';

import { hasInteractiveShell, appearsConfigured, askYesNo } from './check-licenses.js';
import { APPROVED_PROJECTS_FILE_NAME, APPROVED_LICENSES_FILE_NAME } from './report.js';
import type { ProjectAndLicense, Project, License } from './report.js';

export function interactiveMode(
  unapprovedLicenses: Array<ProjectAndLicense>,
  approvedLicenses: Set<License>,
  approvedProjects: Map<Project, License>,
) {
  if (!hasInteractiveShell()) {
    console.log('I\'m not running in an interactive shell, perhaps you\'re trying to run me in interactive mode on a CI server?');

    return;
  }

  if (!appearsConfigured()) {
    //TODO: Ask to download nice and approved license templates here
    // but for now we fall through to the y/n version of configuring
    // return
  }

  if (unapprovedLicenses.length > 0) {
    console.log();
    console.log();
    console.log('Found dependencies using unapproved licenses!');
    const answers = interact('  Accept license ${license} used by ${project}?', unapprovedLicenses);

    handleLicenseApprovals(answers, approvedLicenses);
    handleProjectApprovals(answers, approvedProjects);
    handleNos(answers);
  
  } else {
    console.log('No unapproved licenses found');
  }
}

function interact(questionTemplate, deps: Array<ProjectAndLicense>): {
  yes: Array<string>,
  no: Array<string>,
  approved: Array<ProjectAndLicense>,
} {
  const answers = {
    yes: [],
    no: [],
    approved: [],
  };

  questionLoop: for(let i = 0; i < deps.length; i++) {
    const dep = deps[i];

    const hasSeenLicenseBefore = answers.yes.indexOf(dep.license) >= 0 || answers.no.indexOf(dep.license) >= 0;
    if (hasSeenLicenseBefore) {
      continue;
    }

    const question = questionTemplate
      .replace('${project}', dep.project)
      .replace('${license}', dep.license);

    const ans = askQuestion(question);
    switch (ans.toLowerCase()) {
      case 'y':
        answers.yes.push(dep.license);
        break;
      case 'n':
        answers.no.push(dep.license);
        break;
      case 'p':
        answers.approved.push(dep);
        break;
      case 's':
        // exit the for loop
        break questionLoop;

      case 'q':
        process.exit(0);

      case '?':
        console.log('y: Yes             - accept the license');
        console.log('n: No              - do not accept the license');
        console.log('p: approve Project - accept only this project with the license');
        console.log('s: stop            - stop, but save your progress');
        console.log('q: Quit            - stop this sillyness. Nothing will be saved');
        console.log();
        i--;

        break;
    }
  }

  return answers;
}

function askQuestion(question: string): string {
  process.stdout.write(question + ' [y/n/p/s/q/?] ');

  const ans = read_stdinSync()[0];
  if ('ynpsq?'.indexOf(ans) < 0) {
    return '?';
  }

  return ans;
}

export function read_stdinSync(): string {
  const BUFFER_LENGTH = 100;

  const stdin = fs.openSync('/dev/stdin', 'rs');
  const buffer = Buffer.alloc(BUFFER_LENGTH);

  const readSync: any = fs.readSync;
  readSync(stdin, buffer, 0, BUFFER_LENGTH);
  fs.closeSync(stdin);

  return buffer.toString();
}

function handleLicenseApprovals(answers, approvedLicenses: Set<License>) {
  if (answers.yes.length > 0) {

    console.log();
    console.log('Approving the following licenses:');
    console.log(answers.yes.join(', '));

    answers.yes.forEach(license => approvedLicenses.add(license));
    const toWrite = stringifySet(approvedLicenses);
    fs.writeFileSync('./' + APPROVED_LICENSES_FILE_NAME, toWrite);
  }
}

function handleNos(answers) {
  if (answers.no.length > 0) {
    console.log();
    console.log('You did not approve the following licenses:');
    console.log(answers.no.join(', '));
    console.log();
    console.log();

    console.log('The license check failed');
    // TODO: get exit codes from some standardized place
    process.exit(3);
  }
}

function handleProjectApprovals(answers, approvals: Map<Project, License>) {
  if (answers.approved.length > 0) {
    console.log();
    console.log('You approved the following packages with a corresponding license:');
    console.log(answers.approved.map(pal => pal.project + " - " + pal.license).join('\n'));

    answers.approved.forEach(pal => approvals.set(pal.project, pal.license));
    const toWrite = stringifyMap(approvals);
    fs.writeFileSync('./' + APPROVED_PROJECTS_FILE_NAME, toWrite);
  }
}

function stringifySet(set: Set<string>): string {
  const a = [];
  for (const element of set) {
    a.push(element);
  }
  return JSON.stringify(a);
}

function stringifyMap(map: Map<string, string>): string {
  const o = {};
  for (const [key, value] of map) {
    o[key] = value;
  }
  return JSON.stringify(o);
}
