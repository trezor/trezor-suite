import { notificationsActions } from '@suite-common/toast-notifications';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import { getUnusedChangeAddress } from '@suite-common/wallet-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';
import TrezorConnect, {
    type PrecomposeResultFinal,
    UI_REQUESTS,
    type UiRequestSelectFee,
    asCoinSymbol,
} from '@trezor/connect';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { promiseRaceWithSignal } from '@trezor/utils';

import { CommonPopupFlow, getPayloadOrThrow } from './CommonPopupFlow';
import { buildOptions, pickAccounts } from './selectAccount';
import { SignTransaction } from './signTransaction';
import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { selectConnectPopupCallWithState } from '../connectPopupReducer';
import { CALL_SOURCE_DEEPLINK, type ConnectPopupCallWithState } from '../connectPopupTypes';

/** Lets the user pick an account and a fee for the outputs, then signs it like signTransaction. */
export class SendTransaction extends CommonPopupFlow<'sendTransaction'> {
    private signFlow?: SignTransaction;

    // Suite has no account or fee selection on mobile.
    protected validate() {
        if (this.source.type === CALL_SOURCE_DEEPLINK) {
            throw TypedError('Method_NotAllowed');
        }
        this.getCoin();
    }

    // Suite offers only its own networks, in lower case unlike Connect.
    private getCoin() {
        const symbol = this.payload.coin.toLowerCase();
        if (!isNetworkSymbol(symbol)) {
            throw TypedError('Method_UnsupportedCoinForHost');
        }

        return asCoinSymbol(symbol);
    }

    protected async callMethod() {
        const { push, identity, callId } = this.payload;
        const tx = await this.pickTransaction();

        this.signFlow = new SignTransaction(
            {
                method: 'signTransaction',
                payload: {
                    coin: this.getCoin(),
                    inputs: tx.inputs,
                    outputs: tx.outputs,
                    push,
                    identity,
                    callId,
                },
                source: this.source,
            },
            { dispatch: this.dispatch, getState: this.getState, signal: this.signal },
        );

        return (await this.signFlow.process(tx)).response;
    }

    // Starts over from the picker, as it was left, until the user selects a fee. An account already
    // picked in the picker is taken right away.
    private async pickTransaction(
        previousPicker?: ConnectPopupCallWithState<'select-account'>,
        isPicked = false,
    ): Promise<PrecomposeResultFinal> {
        const { dispatch, getState } = this;
        // The app's callId lets its cancel interrupt whichever Connect call is in flight, the signal
        // stops waiting for the backends.
        const { outputs, identity, baseFee, sequence, sortingStrategy, callId } = this.payload;
        const coin = this.getCoin();
        const coinInfo = await TrezorConnect.getCoinInfo({ coin, callId }).then(getPayloadOrThrow);
        if (coinInfo.type !== 'bitcoin') {
            throw TypedError('Method_UnsupportedCoinForHost');
        }

        const options = {
            ...buildOptions({ coin, addressSelection: 'manual' }),
            isAccountOnly: true,
        };
        const picker = isPicked
            ? selectConnectPopupCallWithState(getState(), 'select-account')
            : await pickAccounts({ dispatch, getState }, options, previousPicker);
        const path = picker?.candidates.find(
            c =>
                c.accountIndex === picker.manualAccountIndex &&
                c.accountTypeKey === picker.selectedAccountTypeKey,
        )?.path;
        if (!picker || !path) {
            throw TypedError('Runtime', 'SendTransaction: no account picked');
        }
        dispatch(connectPopupActions.approvePermissions());

        // The device only derives the descriptor, the account itself is read from the backend. Like
        // for Suite's accounts, SegWit and Taproot ones are described by `xpubSegwit`.
        const { xpub, xpubSegwit } = await TrezorConnect.getPublicKey({
            device: this.getSelectedDevice(),
            coin,
            path,
            callId,
        }).then(getPayloadOrThrow);

        const account = await promiseRaceWithSignal(
            TrezorBlockchain.getAccountInfo({
                coin,
                descriptor: xpubSegwit ?? xpub,
                details: 'tokens',
                identity,
            }),
            this.signal,
        ).then(getPayloadOrThrow);

        const { levels } = await promiseRaceWithSignal(
            TrezorBlockchain.estimateFee({ coin, identity, request: { feeLevels: 'smart' } }),
            this.signal,
        ).then(getPayloadOrThrow);

        const compose = async (feeLevels: { feePerUnit: string }[]) =>
            await TrezorConnect.composeTransaction({
                outputs,
                coin,
                path,
                utxo: account.utxo ?? [],
                changeAddress: getUnusedChangeAddress(account.addresses?.change),
                feeLevels,
                baseFee,
                sequence,
                sortingStrategy,
                callId,
            }).then(getPayloadOrThrow);

        let feeLevels = levels.filter(level => level.feePerUnit !== '0');
        let txs = await compose(feeLevels);
        if (!txs.some(tx => tx.type === 'final')) {
            feeLevels = [{ label: 'custom', feePerUnit: String(coinInfo.minFee), blocks: -1 }];
            txs = await compose(feeLevels);
        }
        const finalFeeLevels = feeLevels.filter((_, index) => txs[index]?.type === 'final');
        if (!finalFeeLevels.length) {
            dispatch(notificationsActions.addToast({ type: 'not-enough-funds-error' }));

            return this.pickTransaction(picker);
        }

        // Resolved by SelectFeeModal, which the modal reducer opens for this Connect UI request.
        // It's shown in the picker's state, so if anything else closes it, Suite shows the picker
        // as it was left, where an account picked again answers without a choice.
        const feeDeferred = getPermissionDeferred(true);
        dispatch({
            type: UI_REQUESTS.REQUEST_FEE,
            payload: { feeLevels: finalFeeLevels, coinInfo },
        } satisfies UiRequestSelectFee);
        dispatch(connectPopupActions.selectAccount(picker));
        const choice = await feeDeferred.promise;
        if (!choice) {
            return this.pickTransaction(undefined, true);
        }
        if (choice.type === 'change-account') {
            return this.pickTransaction(picker);
        }
        dispatch(connectPopupActions.approvePermissions());

        const [tx] =
            choice.type === 'select-fee-custom'
                ? await compose([{ feePerUnit: choice.value }])
                : [txs[feeLevels.findIndex(level => level.label === choice.value)]];
        if (tx?.type !== 'final') {
            throw TypedError('Runtime', 'SendTransaction: Trying to sign unfinished tx');
        }

        return tx;
    }

    cleanup() {
        this.signFlow?.cleanup();
    }
}
