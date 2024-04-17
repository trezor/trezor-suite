#!/bin/bash

distribute_develop_apk() {
    # Install Firebase CLI
    curl -sL https://firebase.tools | bash

    release_notes="Last commit hash: $EAS_BUILD_GIT_COMMIT_HASH"
    echo "$EAS_BUILD_GIT_COMMIT_HASH"
    # Distribute APK to develop-testers group using Firebase CLI
    firebase appdistribution:distribute "$EAS_BUILD_WORKINGDIR"/suite-native/app/android/app/build/outputs/apk/release/app-release.apk \
        --project pc-api-4710771878548015996-769 \
        --app 1:191883890128:android:625bcdab76b3b3a644bdd5 \
        --groups "develop-testers" \
        --release-notes "$release_notes" \
        --token "$FIREBASE_TOKEN"
}

create_release_draft() {
    suite_native_version=$(grep -E '^\s*"suiteNativeVersion":' package.json | awk -F ': ' '{print $2}' | tr -d ',"')

    # Create a GitHub release draft
    curl -L \
        -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GITHUB_TREZOR_SUITE_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        -d '{
            "tag_name": "v'"$suite_native_version"'@mobile",
            "name": "Suite Mobile v'"$suite_native_version"'",
            "body": "'"$EAS_BUILD_GIT_COMMIT_HASH"'",
            "draft": true,
            "prerelease": false,
            "generate_release_notes": false,
            "make_latest": "false"
        }' \
        https://api.github.com/repos/trezor/trezor-suite/releases > /tmp/release_response.json
}

upload_production_apk() {
    # Extract upload URL from the GitHub release draft response
    upload_url=$(grep -o '"upload_url": *"[^"]*"' /tmp/release_response.json | grep -o '"[^"]*"$' | tr -d '"')
    upload_url="${upload_url%\{*}"  # Remove the curly braces and everything after them
    upload_url="${upload_url}?name=Trezor-Suite-Lite-${suite_native_version}.apk"

    # Upload production APK to newly created GitHub release
    curl -L \
        -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GITHUB_TREZOR_SUITE_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        -H "Content-Type: application/octet-stream" \
        "${upload_url}" \
        --data-binary "@$EAS_BUILD_WORKINGDIR/suite-native/app/android/app/build/outputs/apk/release/app-release.apk" > /tmp/asset_response.json

    # Wait until the response file is created and contains data
    until [ -s /tmp/asset_response.json ]; do
        sleep 1
    done

    cat /tmp/asset_response.json

    echo "APK uploaded"
}

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
    if [[ "$EAS_BUILD_PROFILE" == "develop" ]]; then
        distribute_develop_apk
    elif [[ "$EAS_BUILD_PROFILE" == "productionAPK" ]]; then
        create_release_draft
        upload_production_apk
    fi
elif [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
    exit 0
fi
