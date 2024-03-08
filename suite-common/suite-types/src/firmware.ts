export type FirmwareStatus =
    | 'initial' // initial state
    | 'check-seed' // ask user, if has seed properly backed up
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'partially-done' // progress - some old T1B1 firmwares can't update to the latest version. This should be handled by intermediary fw now and it shouldn't even be triggered in real world, but just to be safe let's keep it.
    | 'done'; // firmware successfully installed
