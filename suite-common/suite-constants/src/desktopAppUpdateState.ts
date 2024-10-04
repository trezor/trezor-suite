// TODO: This probably should be placed in suite-common because it desktop app specific but we need it for `@suite-common/toast-notifications`.
//       In future we should introduce some kind of "injecting" notification types depends on platform context.
export enum DesktopAppUpdateState {
    Checking = 'checking', // Checking Github for newer releases
    Available = 'available', // Newer version is available
    NotAvailable = 'not-available', // Currently on the latest version
    Downloading = 'downloading', // Currently downloading the latest version
    Ready = 'ready', // Latest version is downloaded and going to be installed on the next restart

    // This is here, because the code from here *cannot* be imported in the `@trezor/suite` package,
    // and therefore the modals cannot be done via `UserContextModal`.
    EarlyAccessEnable = 'early-access-enable',
    EarlyAccessDisable = 'early-access-disable',
    JustUpdated = 'just-updated',
}
