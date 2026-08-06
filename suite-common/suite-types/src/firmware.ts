import { type Getter } from '@suite-common/dependency-injection';

export type FirmwareStatus =
    | 'initial' // initial state
    | 'started' // progress - firmware update has started, waiting for events from trezor-connect
    | 'thp-pairing' // progress - firmware update has started, waiting for events from trezor-connect
    | 'check-seed' // ask user if they have seed properly backed up
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

export type GetBinFilesBaseUrl = Getter<[], string | undefined>;

export type GetBinFilesBaseUrlDep = {
    getBinFilesBaseUrl: GetBinFilesBaseUrl;
};

// A getter: called directly from non-React code, and subscribed to in components with
// `useGetter(selectGetAllowPrereleaseDep)`.
export type GetAllowPrerelease = Getter<[], boolean>;

export type GetAllowPrereleaseDep = {
    getAllowPrerelease: GetAllowPrerelease;
};

export const selectGetAllowPrereleaseDep = (services: any): GetAllowPrereleaseDep => ({
    getAllowPrerelease: services.getAllowPrerelease,
});
