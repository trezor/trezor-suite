import Bowser from 'bowser';
import { verify, decode, Algorithm, Signature } from 'jws';
import * as semver from 'semver';
import { TransportInfo } from 'trezor-connect';

import { Network } from '@wallet-types';
import { SuiteEnvironmentType, TrezorDevice } from '@suite-types';
import { getUserAgent, getEnvironment } from '@suite-utils/env';
import {
    MessageSystem,
    Message,
    Version,
    OperatingSystem,
    Settings,
    Transport,
    Browser,
    Device,
    Environment,
} from '@suite-types/messageSystem';

export const decodeJws = (jws: string): Signature | null => {
    return decode(jws);
};

export const verifyJws = (jws: string, alg: Algorithm, key: string): boolean => {
    return verify(jws, alg, key);
};

// normalize versions for semver library
const normalizeVersion = (version: Version): string => {
    if (!version) {
        return '';
    }
    if (typeof version === 'string') {
        return version;
    }
    return version.join(' || ');
};

type CurrentSettings = {
    tor: boolean;
    enabledNetworks: Network['symbol'][];
};

const validateSettingsCompatibility = (
    settingsCondition: Settings[],
    currentSettings: CurrentSettings,
): boolean => {
    const settings: {
        [key: string]: any;
    } = currentSettings.enabledNetworks.reduce((o, key) => Object.assign(o, { [key]: true }), {
        tor: currentSettings.tor,
    });

    return settingsCondition.some(settingCondition =>
        Object.entries(settingCondition).every(
            ([key, value]: [string, boolean]) => settings[key] === value,
        ),
    );
};

const validateOSCompatibility = (
    osCondition: OperatingSystem,
    currentOsName: string,
    currentOsVersion: string,
): boolean => {
    const osConditionVersion = normalizeVersion(osCondition[currentOsName]);

    return semver.satisfies(currentOsVersion, osConditionVersion);
};

const validateBrowserCompatibility = (
    browserCondition: Browser,
    currentBrowserName: string,
    currentBrowserVersion: string,
) => {
    const browserConditionVersion = normalizeVersion(browserCondition[currentBrowserName]);

    return semver.satisfies(currentBrowserVersion, browserConditionVersion);
};

const validateEnvironmentCompatibility = (
    environmentCondition: Environment,
    environment: SuiteEnvironmentType,
    suiteVersion: string,
) => {
    const environmentVersionCondition = environmentCondition[environment!];

    return semver.satisfies(suiteVersion, normalizeVersion(environmentVersionCondition));
};

const validateTransportCompatibility = (
    transportCondition: Transport,
    transport: Partial<TransportInfo> | undefined,
) => {
    if (!transport) {
        return false;
    }

    const { version, type } = transport;

    if (version && type === 'bridge') {
        return semver.satisfies(version, normalizeVersion(transportCondition.bridge));
    }

    return false;
};

const validateDeviceCompatibility = (
    deviceConditions: Device[],
    device: TrezorDevice | undefined,
) => {
    if (!device || !device.features) {
        return false;
    }

    const {
        model,
        major_version: majorVersion,
        minor_version: minorVersion,
        patch_version: patchVersion,
    } = device.features;

    const deviceVersion = `${majorVersion}.${minorVersion}.${patchVersion}`;

    return deviceConditions.some(device => {
        let validDevice = true;

        validDevice &&= device.model === model;
        validDevice &&= semver.satisfies(deviceVersion, normalizeVersion(device.firmware));
        // TODO: authorized vendors

        return validDevice;
    });
};

export type Options = {
    tor: boolean;
    enabledNetworks: Network['symbol'][];
    transport: Partial<TransportInfo> | undefined;
    device: TrezorDevice | undefined;
};

export const getValidMessages = (config: MessageSystem | null, options: Options): Message[] => {
    if (!config) {
        return [];
    }

    const { device, transport, tor, enabledNetworks } = options;

    const ua = Bowser.getParser(getUserAgent());

    const osDetail = ua.getOS();
    const currentOsName = osDetail.name?.toLowerCase() || '';
    const currentOsVersion = semver.valid(semver.coerce(osDetail.version)) || '';

    const browserDetail = ua.getBrowser();
    const currentBrowserName = browserDetail.name?.toLowerCase() || '';
    const currentBrowserVersion = semver.valid(semver.coerce(browserDetail.version)) || '';

    const environment = getEnvironment();
    const suiteVersion = semver.valid(semver.coerce(process.env.VERSION)) || '';

    const currentSettings: CurrentSettings = {
        tor,
        enabledNetworks,
    };

    return config.actions
        .filter(action => action.message.active)
        .filter(action =>
            action.conditions.some(condition => {
                const {
                    environment: environmentCondition,
                    os: osCondition,
                    browser: browserCondition,
                    transport: transportCondition,
                    settings: settingsCondition,
                    devices: deviceCondition,
                } = condition;

                if (!validateOSCompatibility(osCondition, currentOsName, currentOsVersion)) {
                    return false;
                }

                if (
                    !validateEnvironmentCompatibility(
                        environmentCondition,
                        environment,
                        suiteVersion,
                    )
                ) {
                    return false;
                }

                if (
                    environment === 'web' &&
                    !validateBrowserCompatibility(
                        browserCondition,
                        currentBrowserName,
                        currentBrowserVersion,
                    )
                ) {
                    return false;
                }

                if (!validateSettingsCompatibility(settingsCondition, currentSettings)) {
                    return false;
                }

                if (!validateTransportCompatibility(transportCondition, transport)) {
                    return false;
                }

                if (!validateDeviceCompatibility(deviceCondition, device)) {
                    return false;
                }

                return true;
            }),
        )
        .map(action => action.message);
};
