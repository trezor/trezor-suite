import type { Action, Condition, Localization, MessageSystem } from '@suite-common/suite-types';

import { isFactIndependentCondition, toFactIndependentConfig } from './factIndependentConditions';

const content: Localization = { en: '', es: '', cs: '', de: '', fr: '', pt: '' };

const duration = { from: '2026-01-01T00:00:00+00:00', to: '2026-12-31T00:00:00+00:00' };
const environment = { desktop: '*', mobile: '!', web: '!' };
const devices = [
    {
        model: 'T2T1' as const,
        vendor: '*' as const,
        firmware: '*' as const,
        bootloader: '*' as const,
        firmwareRevision: '*' as const,
        variant: '*' as const,
    },
];

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

describe('isFactIndependentCondition', () => {
    it('accepts a condition built only from the clock and the build info', () => {
        expect(isFactIndependentCondition({ duration })).toBe(true);
        expect(isFactIndependentCondition({ environment })).toBe(true);
        expect(isFactIndependentCondition({ duration, environment })).toBe(true);
        expect(isFactIndependentCondition({})).toBe(true);
    });

    it('refuses a condition that needs a fact only the renderer can report', () => {
        expect(isFactIndependentCondition({ duration, devices })).toBe(false);
        expect(isFactIndependentCondition({ countryCodes: ['CZ'] })).toBe(false);
        expect(isFactIndependentCondition({ settings: [{ tor: true }] })).toBe(false);
    });
});

describe('toFactIndependentConfig', () => {
    it('keeps an unconditional action and an action that targets only duration', () => {
        const config = getConfig([
            getAction('unconditional', []),
            getAction('duration-only', [{ duration }]),
        ]);

        expect(toFactIndependentConfig(config).actions).toEqual(config.actions);
    });

    it('drops an action that could only ever match on an unknown fact', () => {
        const config = getConfig([getAction('device-only', [{ devices }])]);

        expect(toFactIndependentConfig(config).actions).toEqual([]);
    });

    it('keeps the fact-independent alternatives of an action and drops the rest', () => {
        const config = getConfig([getAction('mixed', [{ duration }, { duration, devices }])]);

        expect(toFactIndependentConfig(config).actions).toEqual([
            getAction('mixed', [{ duration }]),
        ]);
    });

    it('narrows experiments the same way and leaves a config without them alone', () => {
        const groups = [{ variant: 'A', percentage: 100 }];
        const config = getConfig(
            [],
            [
                { experiment: { id: 'duration-only', groups }, conditions: [{ duration }] },
                { experiment: { id: 'device-only', groups }, conditions: [{ devices }] },
            ],
        );

        expect(toFactIndependentConfig(config).experiments).toEqual([
            { experiment: { id: 'duration-only', groups }, conditions: [{ duration }] },
        ]);
        expect(toFactIndependentConfig(getConfig([])).experiments).toBeUndefined();
    });
});
