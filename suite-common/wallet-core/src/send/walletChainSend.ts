import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    AddressDisplayOptions,
    type ComposeActionContext,
    type GeneralPrecomposedLevels,
} from '@suite-common/wallet-types';
import { type PROTO } from '@trezor/connect';
import {
    type ChainComposeContext,
    type ChainSendError,
    type ChainSignOptions,
} from '@trezor/network-module-suite-common-types';

import { toChainSendDevice } from './chainSendAdapter';
import {
    type WalletSettingsRootState,
    selectAddressDisplayType,
    selectAreSatsAmountUnit,
    selectBitcoinAmountUnit,
    selectIsNetworkReserveEnabled,
} from '../settings/walletSettingsReducer';

type NotifyDispatch = (action: ReturnType<typeof notificationsActions.addToast>) => unknown;

/**
 * What a chain network composes with: the form's context and every user setting that can affect
 * composing. Each network reads the settings it supports.
 */
export const selectWalletChainComposeContext = (
    state: WalletSettingsRootState,
    { account: _account, network: _network, ...composeContext }: ComposeActionContext,
): ChainComposeContext => ({
    ...composeContext,
    isNetworkReserveEnabled: selectIsNetworkReserveEnabled(state),
    isSmallestUnitEnabled: selectAreSatsAmountUnit(state),
});

/**
 * Composed levels that failed for a reason the form cannot show (no `errorMessage`) are reported as
 * a toast. Networks give every error the form can show a message, so only unexpected ones remain.
 */
export const notifyChainComposeLevels = (
    dispatch: NotifyDispatch,
    levels: GeneralPrecomposedLevels,
) => {
    Object.values(levels).forEach(tx => {
        if (tx?.type === 'error' && !tx.errorMessage) {
            dispatch(
                notificationsActions.addToast({
                    type: 'sign-tx-error',
                    // Coin selection errors ('COINSELECT') carry their details as a message.
                    error:
                        'message' in tx && typeof tx.message === 'string' ? tx.message : tx.error,
                }),
            );
        }
    });
};

/** A compose that failed outright is reported as the network asked, or not at all. */
export const notifyChainComposeFailure = (dispatch: NotifyDispatch, error: ChainSendError) => {
    if (error.notify === 'message') {
        dispatch(notificationsActions.addToast({ type: 'sign-tx-error', error: error.message }));
    }

    if (error.notify === 'fee-estimation') {
        dispatch(notificationsActions.addToast({ type: 'estimated-fee-error' }));
    }
};

export type SelectWalletChainSignOptionsParams = {
    device: TrezorDevice;
    paymentRequests?: PROTO.PaymentRequest[];
};

/**
 * How the device signs: where, how addresses are shown, and every user setting that can affect
 * signing. Each network reads the settings it supports.
 */
export const selectWalletChainSignOptions = (
    state: WalletSettingsRootState,
    { device, paymentRequests }: SelectWalletChainSignOptionsParams,
): ChainSignOptions => ({
    device: toChainSendDevice(device),
    chunkify: selectAddressDisplayType(state) === AddressDisplayOptions.CHUNKED,
    paymentRequests,
    amountUnit: selectBitcoinAmountUnit(state),
});
