#!/bin/bash

FIREBASE_VERSION="${FIREBASE_VERSION:-v13.16.0}"

distribute_develop_apk() {
    # Install Firebase CLI
    curl -sL https://firebase.tools | sed "s/latest/$FIREBASE_VERSION/" | bash

    release_notes="Last commit hash: $EAS_BUILD_GIT_COMMIT_HASH"
    echo "$EAS_BUILD_GIT_COMMIT_HASH"
    # Distribute APK to develop-testers group using Firebase CLI
    firebase appdistribution:distribute "$EAS_BUILD_WORKINGDIR"/suite-native/app/android/app/build/outputs/apk/release/app-release.apk \
        --project pc-api-4710771878548015996-769 \
        --app 1:191883890128:android:625bcdab76b3b3a644bdd5 \
        --groups "develop-testers" \
        --release-notes "$release_notes"
}

if [[ "$EAS_BUILD_PLATFORM" == "android" && "$EAS_BUILD_PROFILE" == "develop" ]]; then
    distribute_develop_apk
elif [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
    exit 0
fi
