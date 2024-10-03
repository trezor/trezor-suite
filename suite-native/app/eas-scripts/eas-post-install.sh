#!/bin/bash

yarn workspace @suite-common/message-system sign-config

echo $PWD
FINGERPRINT=$(npx @expo/fingerprint .)
EXPO_PUBLIC_RUNTIME_VERSION=$($FINGERPRINT | grep -o '"hash":"[^"]*"' | sed 's/"hash":"//;s/"//')
set-env EXPO_PUBLIC_RUNTIME_VERSION $EXPO_PUBLIC_RUNTIME_VERSION

echo "EXPO_PUBLIC_RUNTIME_VERSION $EXPO_PUBLIC_RUNTIME_VERSION"
