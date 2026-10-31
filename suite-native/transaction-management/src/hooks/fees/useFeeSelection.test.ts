import { combineReducers } from '@reduxjs/toolkit';

import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { useFeeSelection } from './useFeeSelection';
import { createFeeLevel } from '../../__fixtures__/feeLevels';
import { ETH_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';
import { prepareSendFormReducer, transactionManagementActions } from '../../sendFormSlice';

it('commits the prepared preview and all custom gas fields only on explicit confirmation', async () => {
    const wallet = getWalletState();
    const store = createLightStore({
        reducer: {
            discreetMode: createStaticReducer({ isActive: false }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
            wallet: combineReducers({
                settings: createStaticReducer(wallet.settings),
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
    });
    const originalLevels = { normal: createFeeLevel({ feeLimit: '21000' }) };
    store.dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: originalLevels }));
    const updateThunk = jest.fn(() => () => ({ type: 'test/update-draft' }));
    const { result } = await renderHookWithStoreProvider(
        () =>
            useFeeSelection({
                accountKey: ETH_ACCOUNT_KEY,
                formDraftKey: 'stake/test',
                updateThunk,
            }),
        { services: { store, analytics: mockNativeAnalytics() } },
    );
    const customFeeLevels = {
        normal: createFeeLevel({ feeLimit: '99999' }),
        custom: createFeeLevel({ fee: '200', feeLimit: '30000' }),
    };
    expect(store.getState().wallet.send.feeLevels).toEqual(originalLevels);
    await act(() =>
        result.current.handleCustomFeeSet({
            customFeeLevels,
            customFeePerUnit: '15',
            customFeeLimit: '30000',
            customMaxFeePerGas: '30',
            customMaxPriorityFeePerGas: '3',
        }),
    );
    expect(updateThunk).toHaveBeenCalledWith({
        accountKey: ETH_ACCOUNT_KEY,
        formDraftKey: 'stake/test',
        tokenContract: undefined,
        feeLevelLabel: 'custom',
        feePerUnit: '15',
        feeLimit: '30000',
        maxFeePerGas: '30',
        maxPriorityFeePerGas: '3',
    });
    expect(store.getState().wallet.send.feeLevels).toEqual({
        ...originalLevels,
        custom: customFeeLevels.custom,
    });
    await act(() => result.current.handleFeeLevelChange('normal'));
    expect(store.getState().wallet.send.feeLevels.normal).toEqual(originalLevels.normal);
});

it('lets a prepared-transaction flow publish its canonical levels after confirmation', async () => {
    const wallet = getWalletState();
    const store = createLightStore({
        reducer: {
            discreetMode: createStaticReducer({ isActive: false }),
            locale: createStaticReducer({ systemLocaleCode: 'en', appLocaleCode: 'system' }),
            wallet: combineReducers({
                settings: createStaticReducer(wallet.settings),
                send: prepareSendFormReducer({
                    actionTypes: { storageLoad: mockActionType('storageLoad') },
                    reducers: { storageLoadFormDrafts: mockReducer() },
                }),
            }),
        },
    });
    const previewLevels = { custom: createFeeLevel({ fee: '200' }) };
    const signingLevels = { custom: createFeeLevel({ fee: '300' }) };
    const updateThunk = () => (dispatch: typeof store.dispatch) => {
        expect(store.getState().wallet.send.feeLevels).toEqual(previewLevels);
        dispatch(transactionManagementActions.storeFeeLevels({ feeLevels: signingLevels }));
    };
    const { result } = await renderHookWithStoreProvider(
        () =>
            useFeeSelection({
                accountKey: ETH_ACCOUNT_KEY,
                formDraftKey: 'yield/deposit',
                updateThunk,
            }),
        { services: { store, analytics: mockNativeAnalytics() } },
    );
    await act(() =>
        result.current.handleCustomFeeSet({
            customFeeLevels: previewLevels,
            customFeePerUnit: '15',
        }),
    );
    expect(store.getState().wallet.send.feeLevels).toEqual(signingLevels);
});
