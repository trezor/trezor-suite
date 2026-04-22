import { mergeDeepObject } from '../mergeDeepObject';

export const _testDotNotation: {
    settings: {
        feature: {
            enabled: boolean;
            label: string;
        };
    };
} = mergeDeepObject.withOptions(
    { dotNotation: true },
    { 'settings.feature.enabled': true },
    { settings: { feature: { label: 'enabled' } } },
);
