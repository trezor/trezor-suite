import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { TxSimulationAction, TxSimulationMethod } from '@suite-common/wallet-types';

import {
    ConnectPopupStateRootState,
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

            default:
                return null;
        }
    }, [txSimulationPopupCall]);

    if (!action || !account || !txSimulationPopupCall) {
        return null;
    }

    return { action, account, source: txSimulationPopupCall.source };
}
