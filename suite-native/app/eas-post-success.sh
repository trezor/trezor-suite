#!/bin/bash
set -euo pipefail

FIREBASE_VERSION="${FIREBASE_VERSION:-v15.22.3}"
FIREBASE_BINARY_SHA256="${FIREBASE_BINARY_SHA256:-27d7b37280b98e7250dae5f552f21f0ecfdf63968c43d80313cf38a41e491f96}"
FIREBASE_BINARY_PATH="/tmp/firebase-tools-linux-${FIREBASE_VERSION}"
FIREBASE_DOWNLOAD_URL="https://github.com/firebase/firebase-tools/releases/download/${FIREBASE_VERSION}/firebase-tools-linux"

install_firebase_cli() {
    curl -fsSL "$FIREBASE_DOWNLOAD_URL" -o "$FIREBASE_BINARY_PATH"

    if ! printf '%s  %s\n' "$FIREBASE_BINARY_SHA256" "$FIREBASE_BINARY_PATH" | sha256sum -c -; then
        echo "Firebase CLI checksum verification failed." >&2
        exit 1
    fi

    chmod +x "$FIREBASE_BINARY_PATH"
}

distribute_develop_apk() {
    install_firebase_cli

    release_notes="Last commit hash: $EAS_BUILD_GIT_COMMIT_HASH"
    echo "$EAS_BUILD_GIT_COMMIT_HASH"

    "$FIREBASE_BINARY_PATH" appdistribution:distribute "$EAS_BUILD_WORKINGDIR"/suite-native/app/android/app/build/outputs/apk/release/app-release.apk \
        --project pc-api-4710771878548015996-769 \
        --app 1:191883890128:android:625bcdab76b3b3a644bdd5 \
        --groups "develop-testers" \
        --release-notes "$release_notes"
}

if [[ "${EAS_BUILD_PLATFORM:-}" == "android" && "${EAS_BUILD_PROFILE:-}" == "develop" ]]; then
    distribute_develop_apk
elif [[ "${EAS_BUILD_PLATFORM:-}" == "ios" ]]; then
    exit 0
fi
