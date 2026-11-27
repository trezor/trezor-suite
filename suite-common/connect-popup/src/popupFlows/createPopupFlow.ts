import type { CallMethodKeys } from '@trezor/connect';
import { TypedError } from '@trezor/connect-common/src/constants/errors';

import {
    CommonPopupFlow,
    type PopupFlow,
    type PopupFlowParams,
    type PopupFlowThunkApi,
} from './CommonPopupFlow';
import { CardanoComposeTransaction } from './cardanoComposeTransaction';
import { CardanoGetAddress } from './cardanoGetAddress';
import { CardanoGetNativeScriptHash } from './cardanoGetNativeScriptHash';
import { CardanoGetPublicKey } from './cardanoGetPublicKey';
import { CardanoSignMessage } from './cardanoSignMessage';
import { CardanoSignTransaction } from './cardanoSignTransaction';
import { CipherKeyValue } from './cipherKeyValue';
import { ComposePsbt } from './composePsbt';
import { ComposeTransaction } from './composeTransaction';
import { EthereumGetAddress } from './ethereumGetAddress';
import { EthereumGetPublicKey } from './ethereumGetPublicKey';
import { EthereumSignMessage } from './ethereumSignMessage';
import { EthereumSignTransaction } from './ethereumSignTransaction';
import { EthereumSignTypedData } from './ethereumSignTypedData';
import { EthereumVerifyMessage } from './ethereumVerifyMessage';
import { GetAccountInfo } from './getAccountInfo';
import { GetAddress } from './getAddress';
import { GetCoinInfo } from './getCoinInfo';
import { GetDeviceState } from './getDeviceState';
import { GetFeatures } from './getFeatures';
import { GetOwnershipId } from './getOwnershipId';
import { GetOwnershipProof } from './getOwnershipProof';
import { GetPublicKey } from './getPublicKey';
import { MoneroGetAddress } from './moneroGetAddress';
import { MoneroGetWatchKey } from './moneroGetWatchKey';
import { MoneroKeyImageSync } from './moneroKeyImageSync';
import { MoneroSignTransaction } from './moneroSignTransaction';
import { NostrGetPublicKey } from './nostrGetPublicKey';
import { NostrSignEvent } from './nostrSignEvent';
import { PushTransaction } from './pushTransaction';
import { RequestLogin } from './requestLogin';
import { RippleGetAddress } from './rippleGetAddress';
import { RippleSignTransaction } from './rippleSignTransaction';
import { SelectAccount } from './selectAccount';
import { SendTransaction } from './sendTransaction';
import { ShowDeviceTutorial } from './showDeviceTutorial';
import { SignMessage } from './signMessage';
import { SignTransaction } from './signTransaction';
import { SolanaComposeTransaction } from './solanaComposeTransaction';
import { SolanaGetAddress } from './solanaGetAddress';
import { SolanaGetPublicKey } from './solanaGetPublicKey';
import { SolanaSignMessage } from './solanaSignMessage';
import { SolanaSignTransaction } from './solanaSignTransaction';
import { StellarGetAddress } from './stellarGetAddress';
import { StellarSignTransaction } from './stellarSignTransaction';
import { TronComposeTransaction } from './tronComposeTransaction';
import { TronGetAddress } from './tronGetAddress';
import { TronSignTransaction } from './tronSignTransaction';
import { UnlockPath } from './unlockPath';
import { VerifyMessage } from './verifyMessage';
import { type HostMethod } from '../methodInfo';

type PopupFlowConstructor<M extends CallMethodKeys> = new (
    params: PopupFlowParams<M>,
    thunkApi: PopupFlowThunkApi,
) => PopupFlow;

// The flow of every method a host can call, so a new one is described before the popup lets it
// through.
const POPUP_FLOWS: { [M in HostMethod]: PopupFlowConstructor<M> } = {
    // device
    getFeatures: GetFeatures,
    getDeviceState: GetDeviceState,
    showDeviceTutorial: ShowDeviceTutorial,
    requestLogin: RequestLogin,
    cipherKeyValue: CipherKeyValue,
    unlockPath: UnlockPath,
    getOwnershipId: GetOwnershipId,
    getOwnershipProof: GetOwnershipProof,
    // blockchain
    pushTransaction: PushTransaction,
    // account
    getAddress: GetAddress,
    getPublicKey: GetPublicKey,
    getAccountInfo: GetAccountInfo,
    selectAccount: SelectAccount,
    signMessage: SignMessage,
    verifyMessage: VerifyMessage,
    getCoinInfo: GetCoinInfo,
    // bitcoin
    sendTransaction: SendTransaction,
    signTransaction: SignTransaction,
    composePsbt: ComposePsbt,
    composeTransaction: ComposeTransaction,
    // ethereum
    ethereumGetAddress: EthereumGetAddress,
    ethereumGetPublicKey: EthereumGetPublicKey,
    ethereumSignTransaction: EthereumSignTransaction,
    ethereumSignMessage: EthereumSignMessage,
    ethereumSignTypedData: EthereumSignTypedData,
    ethereumVerifyMessage: EthereumVerifyMessage,
    // cardano
    cardanoGetAddress: CardanoGetAddress,
    cardanoGetPublicKey: CardanoGetPublicKey,
    cardanoGetNativeScriptHash: CardanoGetNativeScriptHash,
    cardanoSignTransaction: CardanoSignTransaction,
    cardanoSignMessage: CardanoSignMessage,
    cardanoComposeTransaction: CardanoComposeTransaction,
    // monero
    moneroGetAddress: MoneroGetAddress,
    moneroGetWatchKey: MoneroGetWatchKey,
    moneroKeyImageSync: MoneroKeyImageSync,
    moneroSignTransaction: MoneroSignTransaction,
    // ripple
    rippleGetAddress: RippleGetAddress,
    rippleSignTransaction: RippleSignTransaction,
    // solana
    solanaGetAddress: SolanaGetAddress,
    solanaGetPublicKey: SolanaGetPublicKey,
    solanaSignTransaction: SolanaSignTransaction,
    solanaSignMessage: SolanaSignMessage,
    solanaComposeTransaction: SolanaComposeTransaction,
    // stellar
    stellarGetAddress: StellarGetAddress,
    stellarSignTransaction: StellarSignTransaction,
    // tron
    tronGetAddress: TronGetAddress,
    tronSignTransaction: TronSignTransaction,
    tronComposeTransaction: TronComposeTransaction,
    // nostr
    nostrGetPublicKey: NostrGetPublicKey,
    nostrSignEvent: NostrSignEvent,
};

// A method no host can call, rejected when the call is run.
class UnsupportedFlow extends CommonPopupFlow<CallMethodKeys> {
    protected getMethodInfo = (): never => {
        throw TypedError('Method_Unsupported');
    };
}

// Host apps can send any method name, even a non-string one or one of an inherited property.
const isHostMethod = (method: unknown): method is HostMethod =>
    typeof method === 'string' && Object.hasOwn(POPUP_FLOWS, method);

export const createPopupFlow = (
    params: PopupFlowParams<CallMethodKeys>,
    thunkApi: PopupFlowThunkApi,
): PopupFlow => {
    // The flow of a method takes the params of the same method, which TypeScript cannot relate.
    const PopupFlow = isHostMethod(params.method)
        ? (POPUP_FLOWS[params.method] as PopupFlowConstructor<CallMethodKeys>)
        : UnsupportedFlow;

    return new PopupFlow(params, thunkApi);
};
