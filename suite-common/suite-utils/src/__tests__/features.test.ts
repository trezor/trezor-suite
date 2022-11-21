import * as features from '../features';

const MOCK_FLAGS = {
    FLAG: false,
};

jest.mock('@suite-common/suite-config', () => ({
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
}));

describe('Features utils', () => {
    test('mock flag should be disabled', () => {
        // @ts-expect-error Mocked flag
        expect(features.isFeatureFlagEnabled('FLAG')).toBe(false);
    });

    test('mock flag should be enabled for web', () => {
        // @ts-expect-error Mocked flag
        expect(features.isFeatureFlagEnabled('FLAG', 'web')).toBe(true);
    });

    test('mock flag should be disabled for desktop', () => {
        // @ts-expect-error Mocked flag
        expect(features.isFeatureFlagEnabled('FLAG', 'desktop')).toBe(false);
    });

    test('Unknown flag should always default to false', () => {
        // @ts-expect-error Mocked flag
        expect(features.isFeatureFlagEnabled('UNKNOWN')).toBe(false);
    });
});
