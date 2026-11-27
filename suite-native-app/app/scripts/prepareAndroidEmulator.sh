#!/usr/bin/env bash
# Runs in CI between the emulator boot and the E2E tests.
#
# android-emulator-runner sends `input keyevent 82` as soon as sys.boot_completed=1. Android sets
# that property before it starts the launcher, so the key event waits for a focused window. When
# the launcher needs more than 5 s to get focus, Android raises an ANR for it and the
# "Quickstep isn't responding" dialog then covers the app in every test of the shard.
#
# Wait until the launcher has input focus and dismiss an ANR dialog that the boot left behind.
set -euo pipefail

SERIAL=${ANDROID_SERIAL:-emulator-5554}
TIMEOUT_SECONDS=${1:-120}
# The dialog shows up only after Android has dumped the stacks, several seconds after the ANR.
ANR_DIALOG_GRACE_SECONDS=60
LAUNCHER_PACKAGE=com.android.launcher3

current_focus() {
    adb -s "$SERIAL" shell dumpsys window displays | tr -d '\r' | grep -m1 'mCurrentFocus=' || true
}

# The focused window as the input dispatcher sees it. It lags seconds behind the window manager
# focus on a busy emulator, and only this one decides whether a key event has to wait.
input_focus() {
    adb -s "$SERIAL" shell dumpsys input | tr -d '\r' | grep -A 1 'FocusedWindows:' | tr '\n' ' ' || true
}

# Logged synchronously by the input dispatcher, so it is present before the unlock command returns.
boot_anr_reported() {
    [[ -n $(adb -s "$SERIAL" logcat -d -b system -s WindowManager | grep 'ANR in ActivityRecord' || true) ]]
}

dismissed=0
stable=0
anr_reported=0
if boot_anr_reported; then
    anr_reported=1
    echo "An ANR was raised during boot, waiting for its dialog."
fi

while ((SECONDS < TIMEOUT_SECONDS)); do
    focus=$(current_focus)
    if [[ $focus == *'Application Not Responding'* ]]; then
        echo "Dismissing ANR dialog: ${focus#*mCurrentFocus=}"
        # Same as tapping "Wait"; the process only was slow to start.
        adb -s "$SERIAL" shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS > /dev/null
        dismissed=$((dismissed + 1))
        stable=0
    elif [[ $focus == *"Window{"*" $LAUNCHER_PACKAGE/"* && $(input_focus) == *"name='"*" $LAUNCHER_PACKAGE/"* ]]; then
        if ((anr_reported == 1 && dismissed == 0 && SECONDS < ANR_DIALOG_GRACE_SECONDS)); then
            stable=0
        else
            stable=$((stable + 1))
            if ((stable >= 3)); then
                echo "Emulator is ready (ANR dialogs dismissed: $dismissed)."
                exit 0
            fi
        fi
    else
        stable=0
    fi
    sleep 1
done

echo "::warning::Emulator did not settle on the launcher within ${TIMEOUT_SECONDS}s: $(current_focus)"
