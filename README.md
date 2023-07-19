# rollup-plugin-build-git-version

A rollup plugin, add git info version.json to dist.

## Usage

### Install

```shell
npm install --save-dev rollup-plugin-build-git-version
```

### Config

```JavaScript
const { buildGitVersion } = require("rollup-plugin-build-git-version");

export default {
  plugins: ([
    buildGitVersion(),
  ])
}
```

## Result

```Json
{
    "build": {
        "time": ""
    },
    "git": {
        "branch": "",
        "commit": {
            "id": "",
            "time": "",
            "message": "",
            "author": {
                "name": "",
                "email": ""
            }
        }
    }
}
```
