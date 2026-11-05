import type {
    Action,
    Browser,
    Condition,
    Environment,
    Localization,
    MessageSystem,
    OperatingSystem,
    Transport,
} from '@suite-common/suite-types';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { getValidExperimentIds, getValidMessages, validateConditions } from './evaluateConditions';
import type { ConditionEvaluationParams, MessageSystemPlatform } from './types';

const content: Localization = { en: '', es: '', cs: '', de: '', fr: '', pt: '' };

const getAction = (id: string, conditions: Condition[]): Action => ({
    conditions,
    message: {
        id,
        priority: 100,
        dismissible: false,
        variant: 'info',
        category: 'banner',
        content,
    },
});

const getConfig = (
    actions: Action[],
    experiments?: MessageSystem['experiments'],
): MessageSystem => ({
    version: 1,
    timestamp: '2026-01-01T00:00:00+00:00',
    sequence: 1,
    actions,
    experiments,
});

// '!' is the schema way of saying "never matches", so it is the right default for every key the
// condition under test does not target.
const getEnvironmentCondition = (targeted: Partial<Environment>): Environment => ({
    desktop: '!',
    mobile: '!',
    web: '!',
    ...targeted,
});

const getOsCondition = (targeted: Partial<OperatingSystem>): OperatingSystem => ({
    macos: '!',
    linux: '!',
    windows: '!',
    android: '!',
    ios: '!',
    chromeos: '!',
    ...targeted,
});

const getBrowserCondition = (targeted: Partial<Browser>): Browser => ({
    firefox: '!',
    chrome: '!',
    chromium: '!',
    ...targeted,
});

const getTransportCondition = (targeted: Partial<Transport>): Transport => ({
    bridge: '!',
    webusbplugin: '!',
    ...targeted,
});

const desktopPlatform: MessageSystemPlatform = {
    suiteEnvironment: 'desktop',
    suiteVersion: '26.1.1',
    commitHash: 'f4e2c7d',
    osName: 'linux',
    osVersion: '6.12.0',
    browserName: '',
    browserVersion: '',
};

const params: ConditionEvaluationParams = {
    platform: desktopPlatform,
    settings: { tor: false, enabledNetworks: [asNetworkSymbol('btc')] },
    countryCode: 'CZ',
};

const duration = { from: '2026-01-01T00:00:00+00:00', to: '2026-12-31T00:00:00+00:00' };

describe('condition evaluation outside of a browser', () => {
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockImplementation(() => Date.parse('2026-06-01T00:00:00+00:00'));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('does not read the ambient environment, so it works where there is no window', () => {
        expect(typeof window).toBe('undefined');

        expect(
            validateConditions(
                { duration, environment: getEnvironmentCondition({ desktop: '*' }) },
                params,
            ),
        ).toBe(true);
    });

    it('matches an environment condition against the reported build facts', () => {
        const matches = (targeted: Partial<Environment>) =>
            validateConditions({ environment: getEnvironmentCondition(targeted) }, params);

        expect(matches({ desktop: '>=26.0.0' })).toBe(true);
        expect(matches({ desktop: '>=27.0.0' })).toBe(false);
        expect(matches({ web: '*' })).toBe(false);
        expect(matches({ desktop: '*', revision: 'f4e2c7d' })).toBe(true);
        expect(matches({ desktop: '*', revision: 'deadbee' })).toBe(false);
    });

    it('matches an os condition against the reported os facts', () => {
        const matches = (targeted: Partial<OperatingSystem>) =>
            validateConditions({ os: getOsCondition(targeted) }, params);

        expect(matches({ linux: '>=6.0.0' })).toBe(true);
        expect(matches({ linux: '>=7.0.0' })).toBe(false);
        expect(matches({ macos: '*' })).toBe(false);
    });

    it('ignores a browser condition outside of the web environment', () => {
        const browser = getBrowserCondition({ chrome: '*' });

        expect(validateConditions({ browser }, params)).toBe(true);
        expect(
            validateConditions(
                { browser },
                {
                    ...params,
                    platform: {
                        ...desktopPlatform,
                        suiteEnvironment: 'web',
                        browserName: 'firefox',
                        browserVersion: '140.0',
                    },
                },
            ),
        ).toBe(false);
    });

    it('does not match a condition whose fact is unknown', () => {
        expect(
            validateConditions({ transport: getTransportCondition({ bridge: '*' }) }, params),
        ).toBe(false);
        expect(validateConditions({ countryCodes: ['CZ'] }, params)).toBe(true);
        expect(validateConditions({ countryCodes: ['US'] }, params)).toBe(false);
        expect(validateConditions({ countryCodes: ['CZ'] }, { ...params, countryCode: null })).toBe(
            false,
        );
    });

    it('matches a settings condition against the enabled networks and the tor state', () => {
        expect(validateConditions({ settings: [{ tor: false }] }, params)).toBe(true);
        expect(validateConditions({ settings: [{ tor: true }] }, params)).toBe(false);
        expect(validateConditions({ settings: [{ btc: true }] }, params)).toBe(true);
        expect(validateConditions({ settings: [{ eth: true }] }, params)).toBe(false);
    });

    it('collects the messages of all matching actions and skips the rest', () => {
        const config = getConfig([
            getAction('unconditional', []),
            getAction('matching', [{ duration }]),
            getAction('expired', [
                {
                    duration: {
                        from: '2020-01-01T00:00:00+00:00',
                        to: '2021-01-01T00:00:00+00:00',
                    },
                },
            ]),
        ]);

        expect(getValidMessages(config, params).map(message => message.id)).toEqual([
            'unconditional',
            'matching',
        ]);
        expect(getValidMessages(null, params)).toEqual([]);
    });

    it('collects the ids of all matching experiments', () => {
        const groups = [{ variant: 'A', percentage: 100 }];
        const config = getConfig(
            [],
            [
                { experiment: { id: 'matching', groups }, conditions: [{ duration }] },
                {
                    experiment: { id: 'other-environment', groups },
                    conditions: [{ environment: getEnvironmentCondition({ web: '*' }) }],
                },
            ],
        );

        expect(getValidExperimentIds(config, params)).toEqual(['matching']);
        expect(getValidExperimentIds(getConfig([]), params)).toEqual([]);
    });
});
