import { PassphraseWalletState } from 'src/actions/wallet/passphraseFlowActions';

import { PassphraseFlowState } from './passphraseFlowReducer';
import type { AppState } from '../store';

export const selectPassphraseFlow = (state: AppState): PassphraseFlowState =>
    state.wallet.passphraseFlow;

export const selectPassphraseFlowState = (state: AppState): PassphraseWalletState | undefined =>
    state.wallet.passphraseFlow?.state;

export const selectIsExistingWallet = (state: AppState): boolean | undefined =>
    state.wallet.passphraseFlow?.isExisting;
