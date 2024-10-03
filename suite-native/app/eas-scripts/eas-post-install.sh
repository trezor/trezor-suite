#!/bin/bash

yarn workspace @suite-common/message-system sign-config

EXPO_PUBLIC_RUNTIME_VERSION=$(npx @expo/fingerprint ../. | jq -r '.hash')
set-env EXPO_PUBLIC_RUNTIME_VERSION $EXPO_PUBLIC_RUNTIME_VERSION

echo "EXPO_PUBLIC_RUNTIME_VERSION $EXPO_PUBLIC_RUNTIME_VERSION"