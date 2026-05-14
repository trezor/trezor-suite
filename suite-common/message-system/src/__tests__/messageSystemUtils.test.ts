import { getEnvironment, getOsName } from '@trezor/env-utils';

import * as fixtures from '../__fixtures__/messageSystemUtils';
import { getCachedOsVersion } from '../cachedEnvData';
import * as messageSystem from '../messageSystemUtils';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    getEnvironment: jest.fn(),
    getOsName: jest.fn(),
}));

jest.mock('../cachedEnvData', () => ({
    ...jest.requireActual('../cachedEnvData'),
    getCachedOsVersion: jest.fn(),
}));

describe('Message system utils', () => {
    describe('createVersionRange', () => {
        fixtures.createVersionRange.forEach(f => {
            it(f.description, () => {
                expect(messageSystem.createVersionRange(f.input)).toEqual(f.result);
            });
        });
    });

    describe('isDurationCompatible', () => {
        fixtures.isDurationCompatible.forEach(f => {
            it(f.description, () => {
                jest.spyOn(Date, 'now').mockImplementation(() => Date.parse(f.currentDate));

                expect(messageSystem.isDurationCompatible(f.durationCondition)).toEqual(f.result);
            });
        });
    });

    describe('areSettingsCompatible', () => {
        fixtures.areSettingsCompatible.forEach(f => {
            it(f.description, () => {
                expect(
                    messageSystem.areSettingsCompatible(
                        f.settingsCondition,
                        // @ts-expect-error
                        f.currentSettings,
                    ),
                ).toEqual(f.result);
            });
        });
    });

    describe('isVersionCompatible', () => {
        fixtures.isVersionCompatible.forEach(f => {
            it(f.description, () => {
                expect(messageSystem.isVersionCompatible(f.condition, f.type, f.version)).toEqual(
                    f.result,
                );
            });
        });
    });

    describe('isEnvironmentCompatible', () => {
        const OLD_ENV = { ...process.env };

        afterEach(() => {
            jest.resetModules();
            process.env = OLD_ENV;
        });

        fixtures.isEnvironmentCompatible.forEach(f => {
            it(f.description, () => {
                process.env.COMMITHASH = f.commitHash;

                expect(
                    messageSystem.isEnvironmentCompatible(
                        f.condition,
                        // @ts-expect-error
                        f.type,
                        f.version,
                        f.commitHash,
                    ),
                ).toEqual(f.result);
            });
        });
    });

    describe('isTransportCompatible', () => {
        fixtures.isTransportCompatible.forEach(f => {
            it(f.description, () => {
                expect(
                    messageSystem.isTransportCompatible(
                        f.transportCondition,
                        // @ts-expect-error
                        f.transports,
                    ),
                ).toEqual(f.result);
            });
        });
    });

    describe('isDeviceCompatible', () => {
        fixtures.isDeviceCompatible.forEach(f => {
            it(f.description, () => {
                expect(
                    // @ts-expect-error
                    messageSystem.isDeviceCompatible(f.deviceConditions, f.device),
                ).toEqual(f.result);
            });
        });
    });

    describe('isCountryCodeCompatible', () => {
        fixtures.isCountryCodeCompatible.forEach(f => {
            it(f.description, () => {
                expect(
                    // @ts-expect-error
                    messageSystem.isCountryCodeCompatible(f.allowedCountryCodes, f.countryCode),
                ).toEqual(f.result);
            });
        });
    });

    describe('getValidMessages', () => {
        let userAgentGetter: any;
        const OLD_ENV = { ...process.env };

        beforeEach(() => {
            userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
        });

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetModules();
            process.env = OLD_ENV;
        });

        fixtures.getValidMessages.forEach(f => {
            it(f.description, () => {
                jest.spyOn(Date, 'now').mockImplementation(() => new Date(f.currentDate).getTime());
                (getOsName as jest.Mock).mockImplementation(() => f.osName);
                userAgentGetter.mockReturnValue(f.userAgent);
                (getEnvironment as jest.Mock).mockImplementation(() => f.environment);
                process.env.VERSION = f.suiteVersion;

                (getCachedOsVersion as jest.Mock).mockImplementation(() => f.osVersion);

                expect(messageSystem.getValidMessages(f.config, f.options)).toEqual(f.result);
            });
        });
    });

    describe('getValidExperimentIds', () => {
        let userAgentGetter: any;
        const OLD_ENV = { ...process.env };

        beforeEach(() => {
            userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
        });

        afterEach(() => {
            jest.clearAllMocks();
            jest.resetModules();
            process.env = OLD_ENV;
        });

        fixtures.getValidExperimentIds.forEach(f => {
            it(f.description, () => {
                jest.spyOn(Date, 'now').mockImplementation(() => new Date(f.currentDate).getTime());
                (getOsName as jest.Mock).mockImplementation(() => f.osName);
                userAgentGetter.mockReturnValue(f.userAgent);
                (getCachedOsVersion as jest.Mock).mockImplementation(() => f.osVersion);
                (getEnvironment as jest.Mock).mockImplementation(() => f.environment);
                process.env.VERSION = f.suiteVersion;

                expect(messageSystem.getValidExperimentIds(f.config, f.options)).toEqual(f.result);
            });
        });
    });

    describe('resolveMessageContent', () => {
        fixtures.resolveMessageContentFixture.forEach(f => {
            it(f.description, () => {
                expect(messageSystem.resolveMessageContent(f.message, f.language)).toEqual(
                    f.result,
                );
            });
        });
    });
});
