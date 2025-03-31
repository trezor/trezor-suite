import { Action, Feature, Message } from '@suite-common/suite-types';
import { InvityServerEnvironment } from '@suite-common/trading';
import { featureFlagsInitialState } from '@suite-native/feature-flags';

import { initialState } from '../../tradingSlice';
import {
    selectIsTradingBuyEnabled,
    selectIsTradingEnabled,
    selectIsTradingSellEnabled,
    selectIsTradingSwapEnabled,
    selectTradingEnvironment,
} from '../commonSelectors';

const actionId = 'ActionId_1';
const contentText = 'Content Text';

const getPreloadedState = ({
    buy = false,
    sell = false,
    swap = false,
}: {
    buy?: boolean;
    sell?: boolean;
    swap?: boolean;
}) => {
    const features: Feature[] = [];
    if (buy) {
        features.push({
            domain: 'trading.buy',
            flag: true,
        });
    }
    if (sell) {
        features.push({
            domain: 'trading.sell',
            flag: true,
        });
    }
    if (swap) {
        features.push({
            domain: 'trading.swap',
            flag: true,
        });
    }

    return {
        featureFlags: featureFlagsInitialState,
        messageSystem: {
            config: {
                version: 1,
                timestamp: '2023-01-01',
                sequence: 1,
                actions: [
                    {
                        message: {
                            id: actionId,
                            priority: 1,
                            dismissible: true,
                            variant: 'info',
                            category: ['feature'],
                            content: {
                                'en-GB': contentText,
                                en: contentText,
                                es: contentText,
                                cs: contentText,
                                ru: contentText,
                                ja: contentText,
                                hu: contentText,
                                it: contentText,
                                fr: contentText,
                                de: contentText,
                                tr: contentText,
                                pt: contentText,
                                uk: contentText,
                            },
                            feature: features,
                        } as Message,
                    } as Action,
                ],
                experiments: [],
            },
            currentSequence: 1,
            timestamp: 0,
            validMessages: {
                banner: [],
                context: [],
                modal: [],
                feature: [actionId],
            },
            dismissedMessages: {},
            validExperiments: [],
        },
    };
};

describe('commonSelectors', () => {
    describe('selectTradingEnvironment', () => {
        it('should correctly select trading environment', () => {
            const state = {
                ...initialState,
                tradingEnvironment: 'staging' as InvityServerEnvironment,
            };

            expect(selectTradingEnvironment({ wallet: { tradingNew: state } })).toBe('staging');
        });
    });

    describe('selectIsTradingBuyEnabled', () => {
        it('should correctly select that buy is enabled if remote feature is enabled', () => {
            expect(selectIsTradingBuyEnabled(getPreloadedState({ buy: true }))).toBe(true);
        });

        it('should correctly select that buy is not enabled if remote feature is not enabled', () => {
            expect(selectIsTradingBuyEnabled(getPreloadedState({}))).toBe(false);
        });
    });

    describe('selectIsTradingSwapEnabled', () => {
        it('should correctly select that swap is enabled if remote feature is enabled', () => {
            expect(selectIsTradingSwapEnabled(getPreloadedState({ swap: true }))).toBe(true);
        });

        it('should correctly select that swap is not enabled if remote feature is not enabled', () => {
            expect(selectIsTradingSwapEnabled(getPreloadedState({}))).toBe(false);
        });
    });

    describe('selectIsTradingSellEnabled', () => {
        it('should correctly select that sell is enabled if remote feature is enabled', () => {
            expect(selectIsTradingSellEnabled(getPreloadedState({ sell: true }))).toBe(true);
        });

        it('should correctly select that sell is not enabled if remote feature is not enabled', () => {
            expect(selectIsTradingSellEnabled(getPreloadedState({}))).toBe(false);
        });
    });

    describe('selectIsTradingEnabled', () => {
        it('should correctly select that trading is enabled if one of remote features is enabled', () => {
            expect(selectIsTradingEnabled(getPreloadedState({ sell: true }))).toBe(true);
        });

        it('should correctly select that trading is not enabled if no remote feature is enabled', () => {
            expect(selectIsTradingEnabled(getPreloadedState({}))).toBe(false);
        });
    });
});
