export type FirmwareStatus =
    | 'initial' // initial state
    | 'check-seed' // ask user, if has seed properly backed up
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'done'; // firmware successfully installed
