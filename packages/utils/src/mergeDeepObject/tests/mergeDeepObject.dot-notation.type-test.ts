import { mergeDeepObjectDotNotation } from '../mergeDeepObjectDotNotation';

const baseState: {
    settings: {
        feature: {
            enabled: boolean;
            label: string;
        };
    };
} = {
    settings: {
        feature: {
            enabled: false,
            label: 'disabled',
        },
    },
};

export const _testDotNotation = mergeDeepObjectDotNotation(
    baseState,
    { 'settings.feature.enabled': true },
    { settings: { feature: { label: 'enabled' } } },
);
