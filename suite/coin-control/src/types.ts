import { type ReactNode } from 'react';

import { type SearchOutputLabels } from '@suite-common/transaction-search';
import { type Network } from '@suite-common/wallet-config';
import {
    type Account,
    type UtxoSorting,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type AccountUtxo, type PROTO } from '@trezor/connect';

export type CoinControlAmountSummary = {
    inputCount: number;
    missingAmount?: {
        translationId: 'TR_MISSING_TO_INPUT' | 'TR_MISSING_TO_FEE';
        value: string;
    };
    totalInputAmount: string;
};

export type CoinControlViewModel = {
    account: Account;
    allUtxosSelected: boolean;
    coinjoinRegisteredUtxos: AccountUtxo[];
    coinjoinUnavailableMessages: Record<string, ReactNode>;
    composedInputs: PROTO.TxInputType[];
    dustUtxos: AccountUtxo[];
    isCoinControlEnabled: boolean;
    lowAnonymityUtxos: AccountUtxo[];
    network: Network;
    outputLabels: SearchOutputLabels;
    selectedUtxos: AccountUtxo[];
    spendableUtxos: AccountUtxo[];
    summary: CoinControlAmountSummary;
    targetAnonymity?: number;
    transactions: WalletAccountTransaction[];
    utxoSorting?: UtxoSorting;
    utxosPerPage: number;
};

export type CoinControlActions = {
    close: () => void;
    fetchUtxoTransactions: () => { abort: () => void };
    onShowTransactionDetail: (transaction: WalletAccountTransaction) => void;
    selectUtxoSorting: (ordering: UtxoSorting) => void;
    toggleCheckAllUtxos: () => void;
    toggleCoinControl: () => void;
    toggleUtxoSelection: (utxo: AccountUtxo) => void;
};

export type CoinControlRenderers = {
    renderBaseCurrencyValue: (params: { amount: string; symbol: Account['symbol'] }) => ReactNode;
    renderCryptoAmount: (params: { symbol: Account['symbol']; value: string }) => ReactNode;
    renderPagination: (params: {
        currentPage: number;
        onPageSelected: (page: number) => void;
        perPage: number;
        totalItems: number;
    }) => ReactNode;
    renderTransactionTimestamp: (params: { transaction: WalletAccountTransaction }) => ReactNode;
    renderUtxoAnonymity: (params: { anonymity: number }) => ReactNode;
};
