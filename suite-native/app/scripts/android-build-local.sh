#!/usr/bin/env bash
set -euo pipefail

app_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
jobs=${ANDROID_BUILD_JOBS:-2}
if [[ ! "$jobs" =~ ^[1-9][0-9]*$ ]]; then
    echo "ANDROID_BUILD_JOBS must be a positive integer." >&2
    exit 1
fi

case "$(uname -m)" in
    arm64|aarch64) default_abi=arm64-v8a ;;
    *) default_abi=x86_64 ;;
esac
abi=${ANDROID_BUILD_ABI:-$default_abi}
case "$abi" in
    armeabi-v7a|arm64-v8a|x86|x86_64) ;;
    *) echo "ANDROID_BUILD_ABI must be one Android ABI." >&2; exit 1 ;;
esac

if [[ ! -x "$app_dir/android/gradlew" ]]; then
    echo "Run yarn native:prebuild --platform android before building." >&2
    exit 1
fi

# Keep Java and native compilation bounded without changing CI or normal builds.
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:-} -XX:ActiveProcessorCount=$jobs"
export CMAKE_BUILD_PARALLEL_LEVEL="$jobs"
cd "$app_dir/android"
exec nice -n 10 ./gradlew :app:assembleDebug \
    --no-daemon --no-parallel --max-workers=1 --console=plain \
    "-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=768m -XX:ActiveProcessorCount=$jobs" \
    -Pkotlin.compiler.execution.strategy=in-process \
    "-PreactNativeArchitectures=$abi" \
    "-PlocalNativeBuildJobs=$jobs" \
    --init-script "$app_dir/scripts/android-build-local.gradle" "$@"
