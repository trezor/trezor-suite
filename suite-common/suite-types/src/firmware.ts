export type FirmwareStatus =
    | 'initial' // initial state
    | 'check-seed' // ask user if they have seed properly backed up
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'done'; // firmware successfully installed

/**
 * Firmware check types used in the firmware security checks.
 */
export type FirmwareCheckType =
    | 'Entropy'
    | 'Firmware hash'
    | 'Firmware revision'
    | 'Firmware version'
    | 'Device invariability'
    | 'Device id';

export type ReportSecurityCheckParams = {
    level: 'error' | 'warning';
    checkType: FirmwareCheckType;
    contextData: Record<string, any>;
    payload?: unknown;
};

export type ReportSecurityCheck = (params: ReportSecurityCheckParams) => void;

export type ReportSecurityCheckDep = {
    reportSecurityCheck: ReportSecurityCheck;
};
