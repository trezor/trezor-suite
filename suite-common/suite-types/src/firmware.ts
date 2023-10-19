export type FirmwareStatus =
    | 'initial' // initial state
    | 'check-seed' // ask user, if has seed properly backed up
    | 'waiting-for-bootloader' // navigate user into bootloader mode
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'waiting-for-confirmation' // progress - device waits for confirmation prior starting to update
    | 'installing' // progress - firmware is being installed
    | 'partially-done' // progress - some old T1B1 firmwares can't update to the latest version. This should be handled by intermediary fw now and it shouldn't even be triggered in real world, but just to be safe let's keep it.
    | 'wait-for-reboot' // progress - models T2T1 and T2B1 are restarting after firmware update
    | 'unplug' // progress - user is asked to reconnect device (T1B1)
    | 'reconnect-in-normal' // progress - after unplugging device from previous step, user is asked to connect it again
    | 'validation' // firmware validation in progress
    | 'done'; // firmware successfully installed
