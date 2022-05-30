# @trezor/suite-data

Collection of static assets and scripts for `@trezor/suite-*` packages.

## files

Static assets such as images, translations etc.

## src

### browser detection

Used by `suite-web`. On initial screen load, determine whether the browser is supported. Either show a warning or load the app.

### guide

Updates guide content as described in [Documentation](../../docs/features/guide.md).

### message-system

Contains warning messages to be displayed to a user based on app version and environment. More info in [Documentation](../../docs/features/message-system).

### translations

Scripts to update translations, mostly used by CI jobs. More info in [Documentation](../../docs/features/localization.md).
