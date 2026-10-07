import { type CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import type {
    ChainSendDraft,
    SendFormOption,
    UtxoSorting,
} from '@trezor/network-module-suite-common-types';

import { type AccountKey } from './account';

export type { UtxoSorting };

export type FormOptions = SendFormOption;

export type TronStakingVoteAllocation = {
    address: string;
    votes: string;
};

export type TronStakingFormState =
    | { kind: 'freeze' | 'unstake'; resource: 'bandwidth' | 'energy' }
    | { kind: 'vote'; votes: string; allocations: TronStakingVoteAllocation[] }
    | { kind: 'withdraw' }
    | { kind: 'claim' };

export type FormStateTradingCryptoCurrency = {
    cryptoId: CryptoId | undefined;
    accountKey: AccountKey | undefined;
    symbol: NetworkSymbol;
    contractAddress?: string;
    amount: string;
};

export type FormStateTradingFiatCurrency = {
    amount: string;
    fiatCurrency: string;
};

type FormStateTradingDefault = {
    activeSection: 'sell' | 'exchange';
    isSlip24Active: boolean;
};

type FormStateTradingCommon = {
    recipientName: string;
    send: FormStateTradingCryptoCurrency;
    isSlip24Active: boolean;
};

export type FormStateTradingSell = {
    activeSection: 'sell';
    receive: FormStateTradingFiatCurrency;
} & FormStateTradingCommon;

export type FormStateTradingExchange = {
    activeSection: 'exchange';
    receive: FormStateTradingCryptoCurrency;
    receiveAddress?: string;
} & FormStateTradingCommon;

export type FormStateTrading =
    FormStateTradingSell | FormStateTradingExchange | FormStateTradingDefault;

/** The send form: the draft composing and signing read, plus what only the UI needs. */
export interface FormState extends ChainSendDraft {
    tronStaking?: TronStakingFormState;
    hasCoinControlBeenOpened: boolean;
    anonymityWarningChecked?: boolean;
    trading?: FormStateTrading;
}
