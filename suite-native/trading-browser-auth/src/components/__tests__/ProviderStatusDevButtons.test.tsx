import { combineReducers } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { FeatureFlag, featureFlagsReducer, toggleFeatureFlag } from '@suite-native/feature-flags';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';
import { selectTradingProviderConfirmationStatus, tradingSlice } from '@suite-native/trading-state';

import { ProviderStatusDevButtons } from '../ProviderStatusDevButtons';

describe('ProviderStatusDevButtons', () => {
    let store: TestStore;

    const renderProviderStatusDevButtons = () =>
        renderWithStoreProvider(<ProviderStatusDevButtons />, { store });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                featureFlags: featureFlagsReducer,
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: tradingSlice.prepareReducer(extraDependenciesCommonMock),
                }),
            },
        });
    });

    it('should display nothing without debug mode', () => {
        const { toJSON } = renderProviderStatusDevButtons();

        expect(toJSON()).toBeNull();
    });

    it('should display current status', () => {
        store.dispatch(toggleFeatureFlag({ featureFlag: FeatureFlag.IsTradingDebugEnabled }));
        const { getByText } = renderProviderStatusDevButtons();

        expect(getByText('Current status:')).toBeOnTheScreen();
        expect(getByText('inactive')).toBeOnTheScreen();
    });

    it('should change state on buttons press', async () => {
        store.dispatch(toggleFeatureFlag({ featureFlag: FeatureFlag.IsTradingDebugEnabled }));
        const { getByText } = renderProviderStatusDevButtons();

        await userEvent.press(getByText('restart flow'));
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');

        await userEvent.press(getByText('incomplete'));
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'window_closed_incomplete',
        );

        await userEvent.press(getByText('with_success'));
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'window_closed_with_success',
        );

        await userEvent.press(getByText('failed'));
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_failed',
        );

        await userEvent.press(getByText('success'));
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe(
            'confirmation_success',
        );

        await userEvent.press(getByText('restart flow'));
        expect(selectTradingProviderConfirmationStatus(store.getState())).toBe('window_opened');
    });
});
