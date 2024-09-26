# Suite setup troubleshooting

This document is a guide to overcome common issues with Trezor Suite local dev environment setup.

The setup happy path is described in the main [Suite README](https://github.com/trezor/trezor-suite).

### bcrypto fails yarn install

#### Issue

On Linux, comamnd `yarn` fails with a similar error:

```
bcrypto@npm:5.4.0 couldn't be built successfully (exit code 1, logs can be found here: /tmp/something.log
```

And the mentioned logfile contains: `ModuleNotFoundError: No module named 'distutils'`

#### Solution

In trezor-suite root directory, run:

```
python3 -m venv .venv
source .venv/bin/activate
pip install setuptools
yarn
deactivate
```

When you need it next time in future, repeat the same, but **without** the first command (`python3 -m venv .venv`), because virtualenv has already been created.

#### Explanation

`bcrypto` is a native module that requires `node-gyp` to build, which in turn requires python `gyp`.
However, `bcrypto` relies on the deprecated Python2 build method, and the built-in `distutils` package, which has been removed in Python 3.12.
Installing `setuptools` via pip solves this, as it also provides legacy `distutils`...
but on Linux Ubuntu you can't pip install globally, as it's managed by apt, and there is no apt package anymore which would solve it.
Though you can install `setuptools` in a virtual environment (a.k.a. venv), and yarn then uses it.
