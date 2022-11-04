// TODO: this probably should be placed in suite-common because it desktop app specific but we need it for @suite-common/toast-notifications
// In future we should introduce some kind of "injecting" notification types depends on platform context
/**
 * state: Current updater state
 * - checking: Checking Github for newer releases
 * - available: Newer version is available
 * - not-available: Currently on the latest version
 * - downloading: Currently downloading the latest version
 * - ready: Latest version is downloaded and going to be installed on the next restart
 */
export enum DesktopAppUpdateState {
    Checking = 'checking',
    Available = 'available',
    NotAvailable = 'not-available',
    Downloading = 'downloading',
    Ready = 'ready',
    EarlyAccessEnable = 'early-access-enable',
    EarlyAccessDisable = 'early-access-disable',
}
