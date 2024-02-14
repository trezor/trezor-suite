#!/bin/bash

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  curl -sL https://firebase.tools | bash

  commit_hash=$(git log -1 --pretty=format:"%H")
  release_notes="Bug fixes and improvements. Last commit hash: $commit_hash"

  firebase appdistribution:distribute "$EAS_BUILD_WORKINGDIR"/suite-native/app/android/app/build/outputs/apk/release/app-release.apk \
    --project pc-api-4710771878548015996-769 \
    --app 1:191883890128:android:625bcdab76b3b3a644bdd5 \
    --groups "develop-testers" \
    --release-notes "$release_notes" \
    --token "$FIREBASE_TOKEN"
elif [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  exit 0
fi
