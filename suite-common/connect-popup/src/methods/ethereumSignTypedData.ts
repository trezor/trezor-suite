import { isEvmTxSimulationSupported } from '@suite-common/tx-simulation';
import type { EthereumSignTypedData, EthereumSignTypedDataTypes } from '@trezor/connect';
import { getSerializedPath, validatePath } from '@trezor/connect-common';
import type { Bip43Path } from '@trezor/crypto-utils';

import {
    cleanupEvmSigningAccounts,
    prepareEvmSigningAccount,
    showEvmTxSimulation,
} from './shared/evmSignPreparation';
import {
    type ConnectPopupMethodDefinition,
    type PostCallParams,
    type PreCallParams,
} from './types';

const preCall = async ({
    method,
    payload,
    getState,
    dispatch,
    source,
}: PreCallParams<'ethereumSignTypedData'>): Promise<undefined> => {
    try {
        // The simulation reads typed data only, the payload may be a typed hash too.
        const typedPayload = payload as EthereumSignTypedData<EthereumSignTypedDataTypes>;
        const path = getSerializedPath(validatePath(typedPayload.path)) as Bip43Path;
        const chainId = Number(typedPayload.data.domain.chainId) || 1;
        const isSimulationSupported = isEvmTxSimulationSupported({
            method,
            payload: typedPayload,
        });

        await prepareEvmSigningAccount({ path, chainId, dispatch, getState });
        await showEvmTxSimulation({
            path: typedPayload.path,
            isSimulationSupported,
            source,
            dispatch,
            getState,
        });
    } catch (error) {
        // If an error occurs it's not a problem, we just fall back to generic UI
        console.error(`Error in Connect Popup ${method} hook:`, error);
        if (error.code === 'Method_Cancel') {
            // User cancelled the operation
            throw error;
        }
    }
};

const postCall = ({ dispatch }: PostCallParams<'ethereumSignTypedData'>) => {
    cleanupEvmSigningAccounts(dispatch);

    return false;
};

export const ethereumSignTypedData: ConnectPopupMethodDefinition<'ethereumSignTypedData'> = {
    preCall,
    postCall,
};
