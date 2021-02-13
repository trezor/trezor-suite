# Changelog

All important project changes must be added into the CHANGELOG.md file in the project's root directory. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## CI check

We have a Github Actions job which runs for every PR that checks if CHANGELOG.md has been modified. If not, the job fails.

In the unlikely event of a PR not needing a Changelog entry, you can apply the "no Changelog" label and the job passes then.
