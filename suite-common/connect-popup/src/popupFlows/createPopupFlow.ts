import type { CallMethodKeys } from '@trezor/connect';

import { AddressConfirmationFlow } from './AddressConfirmationFlow';
import {
    CommonPopupFlow,
    type PopupFlow,
    type PopupFlowParams,
    type PopupFlowThunkApi,
} from './CommonPopupFlow';
import { EthereumSignTransaction } from './ethereumSignTransaction';
import { EthereumSignTypedData } from './ethereumSignTypedData';
import { RequestLogin } from './requestLogin';
import { SelectAccount } from './selectAccount';
import { SignTransaction } from './signTransaction';
import { SolanaSignTransaction } from './solanaSignTransaction';
import { StellarSignTransaction } from './stellarSignTransaction';

type PopupFlowConstructor<M extends CallMethodKeys> = new (
    params: PopupFlowParams<M>,
    thunkApi: PopupFlowThunkApi,
) => PopupFlow;

const POPUP_FLOWS: { [M in CallMethodKeys]?: PopupFlowConstructor<M> } = {
    selectAccount: SelectAccount,
    requestLogin: RequestLogin,
    signTransaction: SignTransaction,
    ethereumSignTransaction: EthereumSignTransaction,
    ethereumSignTypedData: EthereumSignTypedData,
    solanaSignTransaction: SolanaSignTransaction,
    stellarSignTransaction: StellarSignTransaction,
    getAddress: AddressConfirmationFlow,
    ethereumGetAddress: AddressConfirmationFlow,
    cardanoGetAddress: AddressConfirmationFlow,
    rippleGetAddress: AddressConfirmationFlow,
    solanaGetAddress: AddressConfirmationFlow,
    tezosGetAddress: AddressConfirmationFlow,
    tronGetAddress: AddressConfirmationFlow,
    stellarGetAddress: AddressConfirmationFlow,
    moneroGetAddress: AddressConfirmationFlow,
    getPublicKey: AddressConfirmationFlow,
    ethereumGetPublicKey: AddressConfirmationFlow,
    cardanoGetPublicKey: AddressConfirmationFlow,
    solanaGetPublicKey: AddressConfirmationFlow,
    tezosGetPublicKey: AddressConfirmationFlow,
};

export const createPopupFlow = (
    params: PopupFlowParams<CallMethodKeys>,
    thunkApi: PopupFlowThunkApi,
): PopupFlow => {
    const { method } = params;
    // Host apps can send any method name, even a non-string one. It must neither fail here, outside
    // the call's error handling, nor match inherited properties like `constructor`.
    const PopupFlow =
        typeof method === 'string' && Object.hasOwn(POPUP_FLOWS, method)
            ? (POPUP_FLOWS[method] as PopupFlowConstructor<CallMethodKeys>)
            : CommonPopupFlow;

    return new PopupFlow(params, thunkApi);
};
