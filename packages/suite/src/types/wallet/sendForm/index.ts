import { Account, Network } from '@wallet-types';
import {
    SendFormActions as SendFormActions$,
    SendFormBtcActions as SendFormBtcActions$,
    SendFormXrpActions as SendFormXrpActions$,
    SendFormEthActions as SendFormEthActions$,
} from './actions';

import { Output as Output$ } from './output';
import {
    PrecomposedTransactionXrp as PrecomposedTransactionXrp$,
    PrecomposedTransactionEth as PrecomposedTransactionEth$,
} from './transactions';

import {
    State as State$,
    InitialState as InitialState$,
    FeeLevel as FeeLevel$,
    FeeInfo as FeeInfo$,
} from './state';

export type SendFormActions = SendFormActions$;
export type SendFormBtcActions = SendFormBtcActions$;
export type SendFormXrpActions = SendFormXrpActions$;
export type SendFormEthActions = SendFormEthActions$;
export type Output = Output$;
export type FeeInfo = FeeInfo$;
export type InitialState = InitialState$;
export type State = State$;
export type FeeLevel = FeeLevel$;
export type PrecomposedTransactionXrp = PrecomposedTransactionXrp$;
export type PrecomposedTransactionEth = PrecomposedTransactionEth$;

export type EthTransaction = {
    network: Account['symbol'];
    token?: string | boolean;
    chainId: Network['chainId'];
    from: Output['address']['value'];
    to: Output['address']['value'];
    amount: Output['amount']['value'];
    data: State['networkTypeEthereum']['data']['value'];
    gasLimit: State['networkTypeEthereum']['data']['value'];
    gasPrice: State['networkTypeEthereum']['data']['value'];
    nonce: string;
    r: string;
    s: string;
    v: string;
};
