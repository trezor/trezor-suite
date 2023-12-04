import { ReactNode } from 'react';
import BigNumber from 'bignumber.js';
import { Translation } from 'src/components/suite';
import { formatNetworkAmount, formatAmount, isTestnet } from '@suite-common/wallet-utils';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { Network, NetworkSymbol } from 'src/types/wallet';
import { ReviewOutput } from 'src/types/wallet/transaction';
import {
    TransactionReviewStepIndicator,
    TransactionReviewStepIndicatorProps,
} from './TransactionReviewStepIndicator';
import {
    TransactionReviewOutputElement,
    OutputElementLine,
} from './TransactionReviewOutputElement';
import type { Account } from 'src/types/wallet';

export type TransactionReviewOutputProps = {
    state: TransactionReviewStepIndicatorProps['state'];
    symbol: Network['symbol'];
    account: Account;
} & ReviewOutput;

export const TransactionReviewOutput = (props: TransactionReviewOutputProps) => {
    const { type, state, label, value, symbol, token, account } = props;
    let outputLabel: ReactNode = label;
    const { networkType } = account;

    if (type === 'locktime') {
        const isTimestamp = new BigNumber(value).gte(BTC_LOCKTIME_VALUE);
        outputLabel = (
            <Translation id={isTimestamp ? 'LOCKTIME_TIMESTAMP' : 'LOCKTIME_BLOCKHEIGHT'} />
        );
    }
    if (type === 'fee') {
        outputLabel = <Translation id={networkType === 'ethereum' ? 'MAX_FEE' : 'FEE'} />;
    }
    if (type === 'contract') {
        outputLabel = <Translation id="TR_CONTRACT" />;
    }
    if (type === 'address' || type === 'regular_legacy') {
        outputLabel = <Translation id="TR_RECIPIENT_ADDRESS" />;
    }
    if (type === 'amount') {
        outputLabel = <Translation id="TR_AMOUNT_SENT" />;
    }
    if (type === 'destination-tag') {
        outputLabel = <Translation id="DESTINATION_TAG" />;
    }
    if (type === 'gas') {
        outputLabel = <Translation id="TR_GAS_PRICE" />;
    }

    let outputValue = value;
    let outputSymbol;
    let fiatVisible = false;
    if (token) {
        outputValue = formatAmount(value, token.decimals);
        outputSymbol = token.symbol as NetworkSymbol;
    } else if (type === 'fee' || type === 'amount') {
        outputValue = formatNetworkAmount(value, symbol);
        outputSymbol = symbol;
        fiatVisible = !isTestnet(symbol);
    } else if (type === 'gas') {
        outputSymbol = symbol;
        fiatVisible = !isTestnet(symbol);
    }

    let outputLines: OutputElementLine[];

    if (type === 'fee-replace') {
        outputLines = [
            {
                id: 'increase-fee-by',
                label: <Translation id="TR_INCREASE_FEE_BY" />,
                value: formatNetworkAmount(value, symbol),
            },
            {
                id: 'increased-fee',
                label: <Translation id="TR_INCREASED_FEE" />,
                value: formatNetworkAmount(props.value2, symbol),
            },
        ];
        outputSymbol = symbol;
        fiatVisible = !isTestnet(symbol);
    } else if (type === 'reduce-output') {
        outputLines = [
            {
                id: 'decrease-address',
                label: <Translation id="TR_RECIPIENT_ADDRESS" />,
                value: props.label,
                plainValue: true,
            },
            {
                id: 'decrease-by',
                label: <Translation id="TR_DECREASE_AMOUNT_BY" />,
                value: formatNetworkAmount(value, symbol),
            },
            {
                id: 'decreased-amount',
                label: <Translation id="TR_DECREASED_AMOUNT" />,
                value: formatNetworkAmount(props.value2, symbol),
            },
        ];
        outputSymbol = symbol;
        fiatVisible = !isTestnet(symbol);
    } else if (type === 'txid') {
        outputLines = [
            {
                id: 'txid',
                label: <Translation id="TR_TXID" />,
                value: outputValue,
                plainValue: true,
            },
        ];
    } else if (type === 'data') {
        outputLines = [
            {
                id: 'data',
                label: <Translation id="DATA_ETH" />,
                value: outputValue,
                plainValue: true,
            },
        ];
    } else if (type === 'regular_legacy') {
        outputLines = [
            {
                id: 'regular_legacy',
                label: outputLabel,
                value: outputValue,
                confirmLabel: <Translation id="TR_RECIPIENT_ADDRESS_MATCH" />,
                plainValue: true,
            },
        ];
    } else if (type === 'contract') {
        outputLines = [
            {
                id: 'contract',
                label: outputLabel,
                value: outputValue,
                plainValue: true,
            },
        ];
    } else if (type === 'address') {
        outputLines = [
            {
                id: 'address',
                label: outputLabel,
                value: outputValue,
                confirmLabel: <Translation id="TR_RECIPIENT_ADDRESS_MATCH" />,
                plainValue: true,
            },
        ];
    } else if (type === 'opreturn') {
        outputLines = [
            {
                id: 'opreturn',
                label: <Translation id="OP_RETURN" />,
                value: outputValue,
                plainValue: true,
            },
        ];
    } else {
        outputLines = [
            {
                id: 'default',
                label: outputLabel,
                value: outputValue,
            },
        ];
    }

    const hasExpansion = (type === 'opreturn' || type === 'data') && outputValue.length >= 10;

    return (
        <TransactionReviewOutputElement
            account={account}
            indicator={<TransactionReviewStepIndicator state={state} size={16} />}
            lines={outputLines}
            token={token}
            state={state}
            cryptoSymbol={outputSymbol as NetworkSymbol}
            fiatSymbol={symbol}
            hasExpansion={hasExpansion}
            fiatVisible={fiatVisible}
        />
    );
};
