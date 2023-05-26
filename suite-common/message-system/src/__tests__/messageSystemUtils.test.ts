import * as envUtils from '@trezor/env-utils';

import * as messageSystem from '../messageSystemUtils';
import * as fixtures from '../__fixtures__/messageSystemUtils';

describe('Message system utils', () => {
    describe('createVersionRange', () => {
        fixtures.createVersionRange.forEach(f => {
            it(f.description, () => {
                expect(messageSystem.createVersionRange(f.input)).toEqual(f.result);
            });
        });
    });

    describe('validateDurationCompatibility', () => {
        fixtures.validateDurationCompatibility.forEach(f => {
            it(f.description, () => {
                jest.spyOn(Date, 'now').mockImplementation(() => Date.parse(f.currentDate));

                expect(messageSystem.validateDurationCompatibility(f.durationCondition)).toEqual(
                    f.result,
                );
            });
        });
    });

    describe('validateSettingsCompatibility', () => {
        fixtures.validateSettingsCompatibility.forEach(f => {
            it(f.description, () => {
                expect(
                    messageSystem.validateSettingsCompatibility(
                        f.settingsCondition,
                        // @ts-expect-error
                        f.currentSettings,
                    ),
                ).toEqual(f.result);
            });
        });
    });

    describe('validateVersionCompatibility', () => {
        fixtures.validateVersionCompatibility.forEach(f => {
            it(f.description, () => {
                expect(
                    messageSystem.validateVersionCompatibility(f.condition, f.type, f.version),
                ).toEqual(f.result);
            });
        });
    });

    describe('validateEnvironmentCompatibility', () => {
        const OLD_ENV = { ...process.env };

        afterEach(() => {
            jest.resetModules();
            process.env = OLD_ENV;
        });

        fixtures.validateEnvironmentCompatibility.forEach(f => {
            it(f.description, () => {
                process.env.COMMITHASH = f.commitHash;

                expect(
                    messageSystem.validateEnvironmentCompatibility(
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

    describe('validateTransportCompatibility', () => {
        fixtures.validateTransportCompatibility.forEach(f => {
            it(f.description, () => {
                expect(
                    // @ts-expect-error
                    messageSystem.validateTransportCompatibility(f.transportCondition, f.transport),
                ).toEqual(f.result);
            });
        });
    });

    describe('validateDeviceCompatibility', () => {
        fixtures.validateDeviceCompatibility.forEach(f => {
            it(f.description, () => {
                expect(
                    // @ts-expect-error
                    messageSystem.validateDeviceCompatibility(f.deviceConditions, f.device),
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
            it(f.description, () => {
                jest.spyOn(Date, 'now').mockImplementation(() => new Date(f.currentDate).getTime());
                // @ts-expect-error (getOsName returns union of string literals)
                jest.spyOn(envUtils, 'getOsName').mockImplementation(() => f.osName);
                userAgentGetter.mockReturnValue(f.userAgent);
                // @ts-expect-error
                jest.spyOn(envUtils, 'getEnvironment').mockImplementation(() => f.environment);
                process.env.VERSION = f.suiteVersion;

                // @ts-expect-error
                expect(messageSystem.getValidMessages(f.config, f.options)).toEqual(f.result);
            });
        });
    });
});
