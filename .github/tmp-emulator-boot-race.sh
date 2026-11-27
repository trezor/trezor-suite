#!/usr/bin/env bash
# TEMPORARY experiment, not meant to be merged.
#
# Repeats cold boots of the Android E2E emulator with the same AVD and emulator options as
# template-suite-native-e2e-android.yml and replays what reactivecircus/android-emulator-runner does
# after boot (poll sys.boot_completed every 2 s, then `input keyevent 82`).
# Variants alternate on the same VM, so emulator versions are compared under identical conditions:
#   <version> immediate  unlock right after sys.boot_completed=1 (runner behaviour)
#   <version> wait       unlock only after the launcher window has input focus (fix candidate)
set -uo pipefail

REPLICA=${REPLICA:-0}
BUDGET_SECONDS=${BUDGET_SECONDS:-2280}
OUT=${OUT:-$PWD/boot-race}

AVD=Pixel_6_API_34
PORT=5554
SERIAL=emulator-$PORT
SYSTEM_IMAGE='system-images;android-34;default;x86_64'
EMULATOR_OPTIONS='-no-window -gpu lavapipe -accel on -no-snapshot -noaudio -no-boot-anim -camera-back none -camera-front none -no-metrics'
VARIANTS=('37.2.13 immediate' '37.3.10 immediate' '37.3.10 wait')
declare -A BUILDS=([37.2.13]=16740729 [37.3.10]=16970787)

SDKMANAGER=$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager
AVDMANAGER=$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager
ADB=$ANDROID_HOME/platform-tools/adb
# Outside the SDK root (so the SDK tools do not see duplicate packages), on the same filesystem.
STORE=$(dirname "$ANDROID_HOME")/emulator-builds
export ANDROID_AVD_HOME=$HOME/.android/avd

now_ms() { date +%s%3N; }
adb_s() { "$ADB" -s "$SERIAL" "$@"; }
focus_state() {
    adb_s shell dumpsys window displays 2>/dev/null | tr -d '\r' | grep -E 'mCurrentFocus=|mFocusedApp=' | head -n 2
}

setup() {
    mkdir -p "$OUT" "$ANDROID_AVD_HOME"
    sudo mkdir -p "$STORE" && sudo chown "$(id -u):$(id -g)" "$STORE" || return 1
    {
        lscpu
        nproc
        free -m
        uname -a
        echo "ImageOS=${ImageOS:-} ImageVersion=${ImageVersion:-}"
        docker ps --format '{{.Names}} {{.Status}}'
    } > "$OUT/host.txt" 2>&1

    # Same SDK packages as the runner action installs.
    yes | "$SDKMANAGER" --licenses > /dev/null || true
    "$SDKMANAGER" --install 'build-tools;37.0.0' platform-tools 'platforms;android-34' > /dev/null || return 1
    "$SDKMANAGER" --install "$SYSTEM_IMAGE" --channel=0 > /dev/null || return 1

    # avdmanager requires a registered emulator package, so keep its package.xml for both builds.
    "$SDKMANAGER" --install emulator --channel=0 > /dev/null || return 1
    cp "$ANDROID_HOME/emulator/package.xml" "$RUNNER_TEMP/emulator-package.xml" || return 1
    rm -rf "$ANDROID_HOME/emulator"
    local version
    for version in "${!BUILDS[@]}"; do
        curl -fsSLo "$RUNNER_TEMP/emulator.zip" \
            "https://dl.google.com/android/repository/emulator-linux_x64-${BUILDS[$version]}.zip" || return 1
        mkdir -p "$STORE/$version"
        unzip -q "$RUNNER_TEMP/emulator.zip" -d "$STORE/$version" || return 1
        rm -f "$RUNNER_TEMP/emulator.zip"
        cp "$RUNNER_TEMP/emulator-package.xml" "$STORE/$version/emulator/package.xml"
    done
    printf 'index\tversion\tmode\temulator\tbooted\tboot_ms\tlaunch_to_booted_ms\twait_ms\tkeyevent_ms\tkeyevent_rc\tanr_lastanr\tanr_logcat\tanr_dialog\tdialog_after_close\tload1\tfocus\n' \
        > "$OUT/results.tsv"
}

# Both builds live next to the SDK; the selected one is renamed to $ANDROID_HOME/emulator.
select_emulator() {
    local version=$1 current
    current=$(cat "$STORE/current" 2> /dev/null || true)
    if [[ $current != "$version" ]]; then
        if [[ -n $current ]]; then
            mv "$ANDROID_HOME/emulator" "$STORE/$current/emulator"
        fi
        mv "$STORE/$version/emulator" "$ANDROID_HOME/emulator"
        echo "$version" > "$STORE/current"
    fi
}

run_boot() {
    local index=$1 version=$2 mode=$3
    local dir
    dir=$OUT/$(printf '%02d' "$index")-$version-$mode
    mkdir -p "$dir"

    "$ADB" kill-server > /dev/null 2>&1
    select_emulator "$version"

    # Same AVD as the runner action creates with force-avd-creation: true.
    echo no | "$AVDMANAGER" create avd --force -n "$AVD" --package "$SYSTEM_IMAGE" --device pixel_6 \
        > "$dir/avdmanager.log" 2>&1
    printf 'hw.cpu.ncore=4\nhw.ramSize=4096M\nhw.heapSize=512M\n' >> "$ANDROID_AVD_HOME/$AVD.avd/config.ini"

    local t_launch emulator_pid
    t_launch=$(now_ms)
    # shellcheck disable=SC2086
    "$ANDROID_HOME/emulator/emulator" -port "$PORT" -avd "$AVD" $EMULATOR_OPTIONS > "$dir/emulator.log" 2>&1 &
    emulator_pid=$!

    # @actions/exec waits 10 s for the stdio of the backgrounded emulator before the runner starts polling.
    sleep 10

    local booted=0 attempt result
    for ((attempt = 0; attempt < 300; attempt++)); do
        result=$(adb_s shell getprop sys.boot_completed 2> /dev/null | tr -d '\r\n ')
        if [[ $result == 1 ]]; then
            booted=1
            break
        fi
        kill -0 "$emulator_pid" 2> /dev/null || break
        sleep 2
    done
    local t_booted load1
    t_booted=$(now_ms)
    read -r load1 _ < /proc/loadavg

    local wait_ms=0 key_ms=-1 key_rc=-1
    local anr_lastanr=0 anr_logcat=0 anr_dialog=0 dialog_after_close=-1 focus=''
    if [[ $booted == 1 ]]; then
        if [[ $mode == wait ]]; then
            local t_wait poll
            t_wait=$(now_ms)
            for ((poll = 0; poll < 240; poll++)); do
                if [[ $(focus_state | grep -m1 'mCurrentFocus=') == *'Window{'*' com.android.launcher3/'* ]]; then
                    break
                fi
                sleep 0.5
            done
            wait_ms=$(($(now_ms) - t_wait))
            # What the input dispatcher itself considers focused at that moment.
            adb_s shell dumpsys input 2> /dev/null | tr -d '\r' | grep -A 3 -E 'FocusedApplications|FocusedWindows' > "$dir/input-focus-before-key.txt"
        fi

        local t_key
        t_key=$(now_ms)
        adb_s shell input keyevent 82 > "$dir/keyevent.txt" 2>&1
        key_rc=$?
        key_ms=$(($(now_ms) - t_key))

        # Remaining post-boot commands of the runner action.
        adb_s shell settings put global window_animation_scale 0.0
        adb_s shell settings put global transition_animation_scale 0.0
        adb_s shell settings put global animator_duration_scale 0.0
        adb_s shell settings put secure spell_checker_enabled 0

        sleep 20

        focus_state > "$dir/focus.txt"
        focus=$(grep -m1 'mCurrentFocus=' "$dir/focus.txt" | sed 's/^ *//')
        adb_s shell dumpsys activity lastanr > "$dir/lastanr.txt" 2>&1
        {
            echo "host_ms=$(now_ms)"
            echo "device_s=$(adb_s shell date +%s.%N | tr -d '\r\n')"
            echo "t_launch_ms=$t_launch"
            echo "t_booted_ms=$t_booted"
            echo "t_key_ms=$t_key"
        } > "$dir/clock.txt"
        adb_s logcat -d -b system,events,crash -v threadtime -v year -v UTC > "$dir/logcat.txt" 2>&1
        adb_s logcat -d -b main -v threadtime -v year -v UTC > "$dir/logcat-main.txt" 2>&1
        adb_s exec-out screencap -p > "$dir/screen.png" 2> /dev/null

        if [[ -s $dir/lastanr.txt ]] && ! grep -q 'no ANR has occurred' "$dir/lastanr.txt"; then
            anr_lastanr=1
        fi
        if grep -qE 'am_anr|ANR in ' "$dir/logcat.txt"; then
            anr_logcat=1
        fi
        if grep -q 'Application Not Responding' "$dir/focus.txt"; then
            anr_dialog=1
            # Remediation check: equivalent to pressing "Wait" in the ANR dialog.
            adb_s shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS > "$dir/close-dialogs.txt" 2>&1
            sleep 3
            focus_state > "$dir/focus-after-close.txt"
            adb_s exec-out screencap -p > "$dir/screen-after-close.png" 2> /dev/null
            dialog_after_close=0
            if grep -q 'Application Not Responding' "$dir/focus-after-close.txt"; then
                dialog_after_close=1
            fi
        fi
    fi

    local emulator boot_ms
    emulator=$(grep -m1 -oE 'Android emulator version [0-9.]+' "$dir/emulator.log" | awk '{print $4}')
    boot_ms=$(grep -m1 -oE 'Boot completed in [0-9]+ ms' "$dir/emulator.log" | awk '{print $4}')
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$index" "$version" "$mode" "${emulator:-?}" "$booted" "${boot_ms:--1}" "$((t_booted - t_launch))" \
        "$wait_ms" "$key_ms" "$key_rc" "$anr_lastanr" "$anr_logcat" "$anr_dialog" "$dialog_after_close" \
        "$load1" "$focus" | tee -a "$OUT/results.tsv"

    if [[ $booted != 1 ]]; then
        tail -n 30 "$dir/emulator.log"
        cat "$dir/avdmanager.log"
        if [[ $index == 0 ]]; then
            echo "First boot failed, aborting." >&2
            exit 1
        fi
    fi

    adb_s emu kill > /dev/null 2>&1
    local tick
    for ((tick = 0; tick < 30; tick++)); do
        kill -0 "$emulator_pid" 2> /dev/null || break
        sleep 1
    done
    kill -9 "$emulator_pid" 2> /dev/null
    pkill -9 -f qemu-system 2> /dev/null
    "$ADB" kill-server > /dev/null 2>&1
    rm -rf "$ANDROID_AVD_HOME/$AVD.avd" "$ANDROID_AVD_HOME/$AVD.ini"
    gzip -f "$dir"/*.txt "$dir/emulator.log" 2> /dev/null
}

if ! setup; then
    echo 'Setup failed.' >&2
    exit 1
fi

started=$SECONDS
index=0
while ((SECONDS - started < BUDGET_SECONDS)); do
    read -r version mode <<< "${VARIANTS[$(((index + REPLICA) % ${#VARIANTS[@]}))]}"
    run_boot "$index" "$version" "$mode"
    index=$((index + 1))
done

if [[ -n ${GITHUB_STEP_SUMMARY:-} ]]; then
    {
        echo '```'
        cat "$OUT/results.tsv"
        echo '```'
    } >> "$GITHUB_STEP_SUMMARY"
fi
