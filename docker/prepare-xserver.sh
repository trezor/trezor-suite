#!/usr/bin/env bash

set -e -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
source _config.sh

launch_linux_xserver() {
  set -x
  xhost +
}

launch_macos_xserver() {
  if [[ ! -d /Applications/Utilities/XQuartz.app ]]; then
    echo "XQuartz.app does not seem to be installed"
    echo "brew install xquartz or download it from https://www.xquartz.org"
    exit 1
  fi

  if [[ ! -f /usr/X11/bin/xhost ]]; then
    echo "/usr/X11/bin/xhost does not seem to be present, this is unexpected"
    exit 2
  fi

  set -x

  # this is important for some reason
  defaults write org.macosforge.xquartz.X11 enable_iglx -bool true

  # https://apple.stackexchange.com/questions/322570/xquartz-enable-allow-connections-from-network-clients-via-command-line
  defaults write org.macosforge.xquartz.X11.plist nolisten_tcp 0

  open -a Xquartz

  # give Xquartz some time to fully launch
  sleep 3

  # this allows network connections to Xquartz, in our case connections originate from docker containers
  /usr/X11/bin/xhost +
}

# ---------------------------------------------------------------------------------------------------------------------

OS_KIND="$(uname -s)"
case "$OS_KIND" in
   Linux)
     echo "detected Linux"
     launch_linux_xserver
     ;;

   Darwin)
     echo "detected macOS"
     launch_macos_xserver
     ;;

   *)
     echo "unsupported OS '$OS_KIND'"
     ;;
esac
