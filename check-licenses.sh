#! /bin/bash
set -eu

$(npm bin)/flow-remove-types check-licenses.js > check-licenses.build.js
trap 'rm check-licenses.build.js' EXIT

node check-licenses.build.js $@

