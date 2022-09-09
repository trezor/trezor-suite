import produce from 'immer';
import { PROTO } from '@trezor/connect';
import { WalletSettings } from '@suite-common/wallet-types';
import { Action, AppState } from '@suite-types';

export type State = WalletSettings;

export const initialState: State = {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc'],
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    lastUsedFeeLevel: {},
};

const settingsReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (
            action.type
            // no default
        ) {
        }
    });

export const selectEnabledNetworks = (state: AppState) => state.wallet.settings.enabledNetworks;

export default settingsReducer;
