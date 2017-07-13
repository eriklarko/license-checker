// @flow

import { findUnapprovedLicenses } from '../src/report.js';

test('find unapproved licenses when none are approved', () => {

  const approvedLicenses = new Set();
  const approvedProjects = new Map();

  const currentLicenses = new Map();
  currentLicenses.set('a', 'MIT');
  currentLicenses.set('b', 'ISC');

  const expected = [
    { license: 'MIT', project: 'a' },
    { license: 'ISC', project: 'b' },
  ];
  const actual = findUnapprovedLicenses(currentLicenses, approvedLicenses, approvedProjects);
  expect(actual).toEqual(expected);
});

test('find unapproved licenses when one is approved', () => {
  const approvedLicenses = new Set(['MIT']);
  const approvedProjects = new Map();

  const currentLicenses = new Map();
  currentLicenses.set('a', 'MIT');
  currentLicenses.set('b', 'MIT');
  currentLicenses.set('c', 'ISC');

  const expected = [
    { license: 'ISC', project: 'c' },
  ];
  const actual = findUnapprovedLicenses(currentLicenses, approvedLicenses, approvedProjects);
  expect(actual).toEqual(expected);
});

test('it returns all projects with an unapproved license', () => {
  const approvedLicenses = new Set(['MIT']);
  const approvedProjects = new Map();

  const currentLicenses = new Map();
  currentLicenses.set('a', 'MIT');
  currentLicenses.set('b', 'ISC');
  currentLicenses.set('c', 'ISC');

  const expected = [
    { license: 'ISC', project: 'b' },
    { license: 'ISC', project: 'c' },
  ];
  const actual = findUnapprovedLicenses(currentLicenses, approvedLicenses, approvedProjects);
  expect(actual).toEqual(expected);
});

test('it doesn\'t return approved projects', () => {
  const approvedLicenses = new Set();
  const approvedProjects = new Map();
  approvedProjects.set('a', 'MIT');

  const currentLicenses = new Map();
  currentLicenses.set('a', 'MIT');
  currentLicenses.set('b', 'ISC');

  const expected = [
    { license: 'ISC', project: 'b' },
  ];
  const actual = findUnapprovedLicenses(currentLicenses, approvedLicenses, approvedProjects);
  expect(actual).toEqual(expected);
});

test('it returns approved projects if their license has changed', () => {
  const approvedLicenses = new Set();
  const approvedProjects = new Map();
  approvedProjects.set('a', 'MIT');

  const currentLicenses = new Map();
  currentLicenses.set('a', 'ISC');

  const expected = [
    { license: 'ISC', project: 'a' },
  ];
  const actual = findUnapprovedLicenses(currentLicenses, approvedLicenses, approvedProjects);
  expect(actual).toEqual(expected);
});

test('an approved project has an approved license', () => {
  const approvedLicenses = new Set(['MIT']);
  const approvedProjects = new Map();
  approvedProjects.set('a', 'MIT');

  const currentLicenses = new Map();
  currentLicenses.set('a', 'MIT');

  const expected = [];
  const actual = findUnapprovedLicenses(currentLicenses, approvedLicenses, approvedProjects);
  expect(actual).toEqual(expected);
});
