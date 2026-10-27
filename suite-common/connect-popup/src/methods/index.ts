import { cardanoGetPublicKey } from './cardanoGetPublicKey';
import { composeTransaction } from './composeTransaction';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { ethereumSignTypedData } from './ethereumSignTypedData';
import { getPublicKey } from './getPublicKey';
import { requestLogin } from './requestLogin';
import { selectAccount } from './selectAccount/selectAccount';
import { createAddressConfirmation } from './shared/addressConfirmation';
import { signTransaction } from './signTransaction';
import { solanaSignTransaction } from './solanaSignTransaction';
import { stellarSignTransaction } from './stellarSignTransaction';
import {
    type ConnectPopupMethodDefinition,
    type ConnectPopupMethodKey,
    type ConnectPopupMethodRegistry,
} from './types';

// Methods without an entry run the generic popup flow only.
const methodDefinitions: ConnectPopupMethodRegistry = {
    cardanoGetAddress: createAddressConfirmation<'cardanoGetAddress'>(),
    cardanoGetPublicKey,
    composeTransaction,
    ethereumGetAddress: createAddressConfirmation<'ethereumGetAddress'>(),
    ethereumGetPublicKey: createAddressConfirmation<'ethereumGetPublicKey'>(),
    ethereumSignTransaction,
    ethereumSignTypedData,
    getAddress: createAddressConfirmation<'getAddress'>(),
    getPublicKey,
    moneroGetAddress: createAddressConfirmation<'moneroGetAddress'>(),
    requestLogin,
    rippleGetAddress: createAddressConfirmation<'rippleGetAddress'>(),
    selectAccount,
    signTransaction,
    solanaGetAddress: createAddressConfirmation<'solanaGetAddress'>(),
    solanaGetPublicKey: createAddressConfirmation<'solanaGetPublicKey'>(),
    solanaSignTransaction,
    stellarGetAddress: createAddressConfirmation<'stellarGetAddress'>(),
    stellarSignTransaction,
    tezosGetAddress: createAddressConfirmation<'tezosGetAddress'>(),
    tezosGetPublicKey: createAddressConfirmation<'tezosGetPublicKey'>(),
    tronGetAddress: createAddressConfirmation<'tronGetAddress'>(),
};

// The method name comes from the calling app, so inherited keys must not resolve to a definition.
export const getMethodDefinition = <M extends ConnectPopupMethodKey>(
    method: M,
): ConnectPopupMethodDefinition<M> | undefined =>
    Object.hasOwn(methodDefinitions, method) ? methodDefinitions[method] : undefined;
