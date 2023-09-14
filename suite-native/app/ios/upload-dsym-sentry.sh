../../../node_modules/@sentry/cli/bin/sentry-cli upload-dsym

export SENTRY_PROPERTIES=sentry.properties

[[ $SENTRY_INCLUDE_NATIVE_SOURCES == "true" ]] && INCLUDE_SOURCES_FLAG="--include-sources" || INCLUDE_SOURCES_FLAG=""
SENTRY_CLI="../../../node_modules/@sentry/cli/bin/sentry-cli"
$SENTRY_CLI debug-files upload "$INCLUDE_SOURCES_FLAG" "$DWARF_DSYM_FOLDER_PATH"
