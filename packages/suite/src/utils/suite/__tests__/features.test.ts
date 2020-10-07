import * as features from '../features';

const MOCK_FLAGS = {
    FLAG: false,
};

jest.mock('@suite-config/features', () => ({
    get FLAGS() {
        return MOCK_FLAGS;
    },
    get FLAGS_WEB() {
        return {
            ...MOCK_FLAGS,
            FLAG: true,
        };
    },
    get FLAGS_DESKTOP() {
        return {
            ...MOCK_FLAGS,
            FLAG: false,
        };
    },
    get FLAGS_LANDING() {
        return {
            ...MOCK_FLAGS,
            FLAG: true,
        };
    },
}));

describe('Features utils', () => {
    test('mock flag should be disabled', () => {
        // @ts-ignore Mocked flag
        expect(features.isEnabled('FLAG')).toBe(false);
    });

    test('mock flag should be enabled for web', () => {
        // @ts-ignore Mocked flag
        expect(features.isEnabled('FLAG', 'web')).toBe(true);
    });

    test('mock flag should be disabled for desktop', () => {
        // @ts-ignore Mocked flag
        expect(features.isEnabled('FLAG', 'desktop')).toBe(false);
    });

    test('mock flag should be enabled for landing', () => {
        // @ts-ignore Mocked flag
        expect(features.isEnabled('FLAG', 'landing')).toBe(true);
    });

    test('Unknown flag should always default to false', () => {
        // @ts-ignore Mocked flag
        expect(features.isEnabled('UNKNOWN')).toBe(false);
    });
});
