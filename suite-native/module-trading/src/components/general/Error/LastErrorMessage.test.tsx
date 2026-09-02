import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { tradingBuyActions } from '@suite-common/trading';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { tradingSlice } from '@suite-native/trading-state';

import { LastErrorMessage, type LastErrorMessageProps } from './LastErrorMessage';

describe('LastErrorMessage', () => {
    let store: TestStore;

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            trading: tradingSlice.prepareReducer({
                actionTypes: { storageLoad: mockActionType('storageLoad') },
            }),
        }),
    } as const;

    const renderLastErrorMessage = async (props: LastErrorMessageProps) =>
        await renderWithStoreProvider(<LastErrorMessage {...props} />, { store });

    beforeEach(() => {
        store = createLightStore({ reducer });
    });

    it('should render nothing when no error is specified', async () => {
        const { toJSON } = await renderLastErrorMessage({ tradingType: 'buy' });

        expect(toJSON()).toBeNull();
    });

    it('should render the last error message for the specified trading type', async () => {
        const errorMessage = 'An error occurred during the buy process';
        store.dispatch(tradingBuyActions.setLastErrorMessage(errorMessage));

        const { getByText } = await renderLastErrorMessage({ tradingType: 'buy' });

        expect(getByText(errorMessage)).toBeOnTheScreen();
    });
});
