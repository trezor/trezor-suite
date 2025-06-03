import * as envUtils from '@trezor/env-utils';

import * as fixtures from '../__fixtures__/messageSystemUtils';
import * as messageSystem from '../messageSystemUtils';

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
            jest.resetModules();
            process.env = OLD_ENV;
        });

        fixtures.getValidMessages.forEach(f => {
            it(f.description, async () => {
                jest.spyOn(Date, 'now').mockImplementation(() => new Date(f.currentDate).getTime());
                jest.spyOn(envUtils, 'getOsName').mockImplementation(() => f.osName);
                userAgentGetter.mockReturnValue(f.userAgent);
                jest.spyOn(envUtils, 'getEnvironment').mockImplementation(() => f.environment);
                process.env.VERSION = f.suiteVersion;

                const { osVersion } = f;
                if (osVersion) {
                    jest.spyOn(envUtils, 'getOsVersion').mockImplementation(() =>
                        Promise.resolve(osVersion),
                    );
                }

                expect(await messageSystem.getValidMessages(f.config, f.options)).toEqual(f.result);
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
            jest.resetModules();
            process.env = OLD_ENV;
        });

        fixtures.getValidExperimentIds.forEach(f => {
            it(f.description, async () => {
                jest.spyOn(Date, 'now').mockImplementation(() => new Date(f.currentDate).getTime());
                jest.spyOn(envUtils, 'getOsName').mockImplementation(() => f.osName);
                userAgentGetter.mockReturnValue(f.userAgent);
                jest.spyOn(envUtils, 'getEnvironment').mockImplementation(() => f.environment);
                process.env.VERSION = f.suiteVersion;

                expect(await messageSystem.getValidExperimentIds(f.config, f.options)).toEqual(
                    f.result,
                );
            });
        });
    });
});
