export type FirmwareStatus =
    | 'initial' // initial state
    | 'check-seed' // ask user, if has seed properly backed up
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'thp-pairing-start' // wait for user confirmation
    | 'thp_pairing_request' // 1st time confirmation on device
    | 'thp_connection_request' // N-th time confirmation on device
    | 'thp_autoconnect_credential_request' // get autoconnect credentials
    | 'thp-pairing' // pairing view (code entry, qr code...)
    | 'thp-pairing-failed' //
    | 'done'; // firmware successfully installed
