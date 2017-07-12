// @flow

const child_process = require('child_process');
const fs = require('fs');

if (process.argv.length === 2) {
  // The script was run without any arguments.
  // 0 is the path to node, 1 is the path to this script

  checkLicenses();
} else if (process.argv.length === 3 && process.argv[2] === '--interactive') {
  interactiveMode();
} else {
  console.log('USAGE:', process.argv[0], process.argv[1], '[--interactive]');
  process.exit(2);
}

type ProjectAndLicense = {
  project: string,
  license: string,
};
type Report = {
  added: Array<ProjectAndLicense>,
  wrongLicense: Array<{
    project: string,
    currentLicense: string,
    knownGoodLicense: string,
  }>,
  removed: Array<ProjectAndLicense>,
};

function checkLicenses() {
  console.log('Checking licenses...');
  const report = generateLicenseReport();

  let isValid = true;
  if (report.added.length > 0) {
    console.log("The following dependencies have not been previously accepted:");
    for (const dep of report.added) {
      console.log('    ', dep.project, '-', dep.license);
    }

    isValid = false;
  } else {
    console.log('No new dependencies');
  }

  if (report.removed.length > 0) {
    console.log("The following dependencies have been removed:");
    for (const dep of report.removed) {
      console.log('    ', dep.project, '-', dep.license);
    }

    isValid = false;
  } else {
    console.log('No removed dependencies');
  }

  if (report.wrongLicense.length > 0) {
    console.log("The following dependencies have changed licenses:");
    for (const dep of report.wrongLicense) {
      console.log('    ', dep.project, 'was', dep.knownGoodLicense, ', but is now', dep.currentLicense);
    }

    isValid = false;
  } else {
    console.log('No dependencies changed license');
  }

  if (!isValid) {
    console.log("The current licenses need to be approved by a human");
    process.exit(1);
  }
}

function generateLicenseReport(): Report {
  console.log('Generating license report...');
  const knownGood = getKnownGoodLicenses();
  const current = getCurrentLicenses();

  const report = {
    added: [],
    wrongLicense: [],
    removed: [],
    current: current,
  };

  for (const [project, projectsCurrentLicense] of current) {
    const projectsKnowGoodLicense = knownGood.get(project);

    const isKnown = knownGood.has(project);
    const hasCorrectLicense = isKnown && projectsKnowGoodLicense.license === projectsCurrentLicense.license;

    // Delete the key in the knownGood object so that we
    // know that all keys left in the object after this 
    // loop are dependencies that have been removed
    knownGood.delete(project);
    
    if (!isKnown) {
      report.added.push(projectsCurrentLicense);
    } else if (!hasCorrectLicense) {
      report.wrongLicense.push({
        project: project,
        currentLicense: projectsCurrentLicense.license,
        knownGoodLicense: projectsKnowGoodLicense.license,
      });
    } else {
      report.removed.push(projectsCurrentLicense);
    }
  }
  report.removed = knownGood.values();

  return report;
}

function getKnownGoodLicenses(): Map<string, ProjectAndLicense> {
  return readKnownGoodLicensesFile() || new Map();

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
}

function getCurrentLicenses(): Map<string, ProjectAndLicense> {
  console.log('Getting the current licenses of all dependencies...');
  const yarnLsOutput = child_process.execSync('yarn licenses ls --json').toString();
  return parseRawOutput(yarnLsOutput);

  function parseRawOutput(yarnLsOutput) {
    const rawData = findRawData(yarnLsOutput);
    if (!rawData) {
      return new Map();
    }
    
    return rawData.body.reduce((acc, rawDependency) => {
      const dependency = toInternalRepresentation(rawData.head, rawDependency);
      acc.set(dependency.project, dependency);
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
}

function interactiveMode() {
  const report = generateLicenseReport();
  const toSave: Map<string, ProjectAndLicense> = new Map();

  if (report.added.length > 0) {
    console.log("The following dependencies have not been previously accepted:");
    const answers = interact('  Do you want to accept ${project} - ${license}?', report.added);
    answers.yes.forEach((v, k) => toSave.set(k, v));

  } else {
    console.log('No new dependencies');
  }

  if (report.wrongLicense.length > 0) {
    const bepa = report.wrongLicense.map(dep => {
      return { project: dep.project, license: dep.currentLicense };
    });

    console.log('The following dependencies have changed license:');
    const answers = interact('  Accept license change of ${project} to  ${license}?', bepa);
    answers.yes.forEach((v, k) => toSave.set(k, v));

  } else {
    console.log('No dependencies changed license');
  }

  const toWrite = stringifyMap(toSave);
  console.log('SAVING', toWrite)
  fs.writeFileSync('known-good-licenses.json', toWrite);

  function stringifyMap(map): string {
    const a = {};
    for(const [key, value] of map) {
      a[key] = value;
    }

    return JSON.stringify(a);
  }
}

function interact(questionTemplate, deps: Array<ProjectAndLicense>) {
  const answers = {
    yes: new Map(),
    no: new Map(),
  };

  for (const dep of deps) {
    const question = questionTemplate
      .replace('${project}', dep.project)
      .replace('${license}', dep.license);

    //process.stdout.write(question, '[y/n/q/a/?] ');
    console.log(question, '[y/n/q/a/?] ');
    let ans = read_stdinSync()[0];
    if ('ynqa?'.indexOf(ans) < 0) {
      ans = '?';
    }

    switch (ans) {
      case 'y':
        answers.yes.set(dep.project, dep);
        break;
      case 'n':
        answers.no.set(dep.project, dep);
        break;

      case 'a':
        for (const dep of deps) {
          answers.yes.set(dep.project, dep);
        }
        return answers;

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

  function read_stdinSync() {
    const BUFFER_LENGTH = 100;

    const stdin = fs.openSync('/dev/stdin', 'rs');
    const buffer = Buffer.alloc(BUFFER_LENGTH);

    fs.readSync(stdin, buffer, 0, BUFFER_LENGTH);
    fs.closeSync(stdin);

    return buffer.toString();
  }
}

