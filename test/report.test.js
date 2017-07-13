// @flow

import { findUnapprovedLicenses } from '../src/report.js';

test('find unapproved licenses when none are approved', () => {

  const approvedLicenses = new Set();
  const approvedProjects = new Map();

  const currentLicenses = new Map();
  currentLicenses.set('a', 'MIT');
  currentLicenses.set('b', 'ISC');

  const actual = findUnapprovedLicenses(currentLicenses, approvedLicenses, approvedProjects);
  const expected = [
    { license: 'MIT', project: 'a' },
    { license: 'ISC', project: 'b' },
  ];
  expect(actual).toEqual(expected);
});
