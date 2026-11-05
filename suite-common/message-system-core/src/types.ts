import type { CountryCode } from '@suite-common/geolocation';
import type { Category, TrezorDevice } from '@suite-common/suite-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { TransportInfo } from '@trezor/connect';
import type { Environment } from '@trezor/env-utils';

export type MessageSystemSettings = {
    tor: boolean;
    enabledNetworks: NetworkSymbol[];
};

/**
 * Facts about the running build and operating system that message system conditions can target.
 * They are passed in rather than read from the ambient environment, because the Electron main
 * process has no `window` to read the OS and browser facts from.
 */
export type MessageSystemPlatform = {
    suiteEnvironment: Environment;
    suiteVersion: string;
    commitHash: string | undefined;
    osName: string;
    osVersion: string | undefined;
    browserName: string;
    browserVersion: string;
};

export type ConditionEvaluationParams = {
    platform: MessageSystemPlatform;
    settings: MessageSystemSettings;
    transports?: TransportInfo[];
    device?: TrezorDevice;
    countryCode: CountryCode | null;
};

export type ValidMessages = {
    [key in Category]: string[];
};
