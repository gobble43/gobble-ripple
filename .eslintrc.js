module.exports = {
    "extends": "airbnb",
    "installedESLint": true,
    "plugins": [
        "react"
    ],
    "rules": {
    "no-console": 0,  // allow use of console (off by default in the node environment)
    "no-undef": 0, // allow undefined 'describe' function from mocha
    "global-require": 0, // needed for cluster architecture
    "no-param-reassign": 0,
    "arrow-body-style": 0,
    "max-len": 0,
    "new-cap": 0,
  }
};