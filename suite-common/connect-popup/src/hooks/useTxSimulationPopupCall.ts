import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';
import { isSupportedSolanaNetwork } from '@trezor/network-solana/constants';
import { isSupportedStellarNetwork } from '@trezor/network-stellar/constants';

import {
    type ConnectPopupStateRootState,
    selectConnectPopupCallWithState,
} from '../connectPopupReducer';

export function useTxSimulationPopupCall() {
    const txSimulationPopupCall = useSelector((state: ConnectPopupStateRootState) =>
        selectConnectPopupCallWithState(state, 'tx-simulation'),
    );
    const account = useSelector((state: AccountsRootState) =>
        txSimulationPopupCall
            ? selectAccountByKey(state, txSimulationPopupCall.selectedAccountKey)
            : null,
    );

    // Map txSimulationPopupCall to TxSimulationAction (make sure type narrowing is correct, i.e. the `method` matches the expected `payload` type)
    const action = useMemo<TxSimulationAction | null>(() => {
        if (!txSimulationPopupCall) {
            return null;
        }

        const { method, payload, fromAddress, source } = txSimulationPopupCall;

        switch (method) {
            case 'ethereumSignTransaction':
                return {
                    method,
                    payload: payload as TxSimulationMethod<'ethereumSignTransaction'>['payload'],
                    fromAddress,
                    sourceOrigin: source.origin,
                };

            case 'ethereumSignTypedData':
                return {
                    method,
                    payload: payload as TxSimulationMethod<'ethereumSignTypedData'>['payload'],
                    fromAddress,
                    sourceOrigin: source.origin,
                };

            case 'solanaSignTransaction': {
                // The account is resolved by the method hook before the simulation is dispatched.
                if (!account || !isSupportedSolanaNetwork(account.symbol)) {
                    return null;
                }

                return {
                    method,
                    symbol: account.symbol,
                    payload: payload as TxSimulationMethod<'solanaSignTransaction'>['payload'],
                    fromAddress,
                    sourceOrigin: source.origin,
                };
            }

            case 'stellarSignTransaction': {
                if (!account || !isSupportedStellarNetwork(account.symbol)) {
                    return null;
                }

                return {
                    method,
                    symbol: account.symbol,
                    payload: payload as TxSimulationMethod<'stellarSignTransaction'>['payload'],
                    fromAddress,
                    sourceOrigin: source.origin,
                };
            }

            default:
                return null;
        }
    }, [txSimulationPopupCall, account]);

    if (!action || !account || !txSimulationPopupCall) {
        return null;
    }

    return { action, account, source: txSimulationPopupCall.source };
}
