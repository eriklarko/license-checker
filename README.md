# license checker

**A tool that breaks your CI build if your dependencies are using unapproved licenses.**


Licenses are important [citation needed] but no one appears to care much about them [1][2][3][4][5]. And even if you do, it's very very easy for someone on your team to add a new dependency without checking that it's licensed in a way that works for your product. Or a project whose license you've approved might change license in a future upgrade.

This tool is designed to make it easy for you to manage the licenses of your dependencies by breaking your build when you're using unapproved licenses.


## Features

1. whitelist licenses.
New dependencies with these licenses will not break your build.

2. whitelist projects.
Break the build if the project changes license to an unapproved license.

3. Friendly CLI to approve new licenses or projects


### Wishlist

Licenses in external files as with sntp

Intelligently handle licenses like `MIT OR BSD`, `MIT AND CC-BY-3.0` and `Apache*`

Predefined whitelists curated by people who know stuff about licenses

Support for other environments. Right now it only supports Yarn.

Find licenses that don't work together or that contradict each other


## Screenshots! \o/

![First run](/doc-images/first-run.png?raw=true "Fist run")

![Dependency with unapproved license](/doc-images/unapproved-license.png?raw=true "Dependecy with unapproved license")


## How to integrate

### Travis

### Circle

### Others

1. Make the binary accessible to your build
1.1. Download a reasonable version [here](TODO)
1.2. `git add` this tool
2. Run this tool in your build. It exits with a non-zero exit code if unapproved licenses are found

