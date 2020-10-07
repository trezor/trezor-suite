import * as features from '../features';

describe('Features utils', () => {
    test('example flag should be enabled', () => {
        expect(features.isEnabled('EXAMPLE')).toBe(true);
    });

    test('example flag should be enabled for web', () => {
        expect(features.isEnabled('EXAMPLE', 'web')).toBe(true);
    });

    test('example flag should be disabled for desktop', () => {
        expect(features.isEnabled('EXAMPLE', 'desktop')).toBe(false);
    });

    test('example flag should be enabled for landing', () => {
        expect(features.isEnabled('EXAMPLE', 'landing')).toBe(true);
    });
});
