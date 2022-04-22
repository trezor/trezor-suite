# Deploying Connect

_Written by @szymonlesisz, checked by @tsusanka._

## Creating a new minor version

1. Go to develop branch.
1. Make sure that CHANGELOG is up to date. Usually, it is not, so walk thru commits and update it.
1. Run `yarn version:patch` - this will update the version number in multiple files.
1. Commit these changes with the Changelog changes into `develop` with message "version X.X.X" ([example commit](https://github.com/trezor/connect/commit/d28e506524bc666757715294f7d030ea1a1d6eef)).
1. Prepare PR from `develop` to `v8` branch, paste changelog as description and tag @prusnak or @tsusanka ([example PR](https://github.com/trezor/connect/pull/812)).
1. Review and merge:
    - `git checkout v8`
    - `git merge develop`
    - `git push v8`

## Deploying

After the merge, we deploy it to connect.trezor.io. You, of course, need access rights to our GitLab CI to do this.

1. Merge pull request into v8 branch
1. Let GitLab CI run all jobs
1. Trigger manual job `deploy production`

## Updating NPM

### Production

1. After Connect is deployed, it is time to publish it into npm [1]
1. Merge pull request into v8 branch
1. Let GitLab CI run all jobs
1. Trigger manual job `publish release to npm`
1. After the job finishes, the new public version is published to the NPM registry.

[1] Make sure that you do have access to our GitLab CI and permissions to trigger this manual job.

### Beta

If you want to publish to npm as `beta` (from any branch, production release is not required), do the following:

1. Bump beta version with `yarn version:beta -c` [2]
1. Push changes to your branch
1. Let GitLab CI run all jobs
1. Trigger manual job `publish beta release to npm`
1. After the job finishes, the new beta version is published to the NPM registry.

[2] Versioning in npm is sensitive and cannot be reverted. Once you publish a version, it is "gone" forever.
For example, if the current version is `8.1.27` and you publish `8.1.28` by mistake with a custom `beta` tag, the next official version will have to be `8.1.29`
This is why the suffix `8.1.27-beta.[number]` in published package.json is essential. You can do another release with `-beta.2` `-beta.3` etc., instead of bumping the actual version patch number.

### Local build (legacy way)

It is still possible to deploy trezor-connect using local machine. Of course you need to have access to `aws` and `npm-registry`.

### manual build for connect.trezor.io

```bash
# build in docker
./scripts/docker-build.sh
# publish to connect.trezor.io/8/
./scripts/s3sync.sh 8
```

### manual build for npm

```bash
# build npm libs in docker
./scripts/docker-build.sh npm
./scripts/docker-build.sh npm-extended

cd ./npm && npm publish
cd ./npm-extended && npm-publish --tag extended
```
