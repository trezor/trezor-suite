# e2e testing 

## Desktop
Desktop e2e tests do not have ambition to cover entire application logic - this is left to web version, instead
they focus on what is specific for this type of build, mostly code located in `packages/suite-desktop/src-electron`

Typical goals of desktop tests are:
- app starts and loads correctly across all target platforms
- app spawns trezord process 
- app starts http receiver and stops it before exiting
- navigation works

To control integration tests for desktop version of Trezor Suite [Spectron](https://www.electronjs.org/spectron) framework is employed.

## Web
TODO: transfer docs here