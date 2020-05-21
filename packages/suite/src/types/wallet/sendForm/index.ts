import { Network } from '@wallet-types';
import {
    SendFormActions as SendFormActions$,
    SendFormBtcActions as SendFormBtcActions$,
    SendFormXrpActions as SendFormXrpActions$,
    SendFormEthActions as SendFormEthActions$,
} from './actions';

import { Output as Output$ } from './output';
import { FeeLevel as FeeLevel$, TokenInfo } from 'trezor-connect';
import {
    PrecomposedTransactionXrp as PrecomposedTransactionXrp$,
    PrecomposedTransactionEth as PrecomposedTransactionEth$,
} from './transactions';

import { State as State$, InitialState as InitialState$, FeeInfo as FeeInfo$ } from './state';

export type SendFormActions = SendFormActions$;
export type SendFormBtcActions = SendFormBtcActions$;
export type SendFormXrpActions = SendFormXrpActions$;
export type SendFormEthActions = SendFormEthActions$;
export type Output = Output$;
export type FeeInfo = FeeInfo$;
export type FeeLevel = FeeLevel$;
export type InitialState = InitialState$;
export type State = State$;
export type PrecomposedTransactionXrp = PrecomposedTransactionXrp$;
export type PrecomposedTransactionEth = PrecomposedTransactionEth$;

export type EthTransactionData = {
    token?: TokenInfo;
    chainId: Network['chainId'];
    to: NonNullable<Output['address']['value']>;
    amount: NonNullable<Output['amount']['value']>;
    data?: State['networkTypeEthereum']['data']['value'];
    gasLimit: State['networkTypeEthereum']['data']['value'];
    gasPrice: State['networkTypeEthereum']['data']['value'];
    nonce: string;
};
