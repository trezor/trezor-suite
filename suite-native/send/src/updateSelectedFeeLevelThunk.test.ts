import { type UnknownAction } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { sendFormActions } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';

import {
    type UpdateSelectedFeeLevelThunkState,
    updateSelectedFeeLevelThunk,
} from './sendFormThunks';

it('preserves both confirmed EIP-1559 fields in the send draft', async () => {
    const accountKey = mockAccountKey({ symbol: asNetworkSymbol('eth') });
    const key = getSendFormDraftKey(accountKey);
    const formState = {
        outputs: [],
        selectedFee: 'normal',
        feePerUnit: '10',
        feeLimit: '21000',
        maxFeePerGas: '20',
        maxPriorityFeePerGas: '2',
        options: [],
        selectedUtxos: [],
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
    } as FormState;
    const preloadedState: UpdateSelectedFeeLevelThunkState = {
        wallet: { send: { drafts: { [key]: formState } } },
    };
    const reducer = (state = preloadedState, action: UnknownAction) =>
        sendFormActions.storeDraft.match(action)
            ? { wallet: { send: { drafts: { [key]: action.payload.formState } } } }
            : state;
    const { store } = createTestCompositionRoot<void, UpdateSelectedFeeLevelThunkState>({
        preloadedState,
        reducer,
    }).services;
    await store.dispatch(
        updateSelectedFeeLevelThunk({
            accountKey,
            feeLevelLabel: 'custom',
            feePerUnit: '15',
            feeLimit: '30000',
            maxFeePerGas: '30',
            maxPriorityFeePerGas: '3',
        }),
    );
    expect(store.getState().wallet.send.drafts[key]).toEqual(
        expect.objectContaining({
            selectedFee: 'custom',
            feePerUnit: '15',
            feeLimit: '30000',
            maxFeePerGas: '30',
            maxPriorityFeePerGas: '3',
        }),
    );
});
