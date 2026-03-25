import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { U_INT_32 } from '@suite-common/wallet-constants';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type TxSimulationAction, type TxSimulationMethod } from '@suite-common/wallet-types';

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
            case 'ethereumSignTransaction': {
                const typedPayload =
                    payload as TxSimulationMethod<'ethereumSignTransaction'>['payload'];

                return {
                    method,
                    payload: {
                        ...typedPayload,
                        transaction: {
                            ...typedPayload.transaction,
                            // Ensure a high gas limit to prevent out of gas errors during simulation
                            gasLimit: `0x${U_INT_32.toString(16)}`,
                        },
                    },
                    fromAddress,
                    sourceOrigin: source.origin,
                };
            }

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
