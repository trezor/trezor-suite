import React from 'react';
import BigNumber from 'bignumber.js';
import { Translation } from '@suite-components';
import { formatNetworkAmount, formatAmount, isTestnet } from '@suite-common/wallet-utils';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { Network, NetworkSymbol } from '@wallet-types';
import { TokenInfo } from '@trezor/connect';
import Indicator, { Props as IndicatorProps } from './Indicator';
import OutputElement, { OutputElementLine } from './OutputElement';
import type { Account } from '@wallet-types';

export type OutputProps =
    | {
          type: 'regular';
          label: string;
          value: string;
          value2?: undefined;
          token?: TokenInfo;
      }
    | {
          type: 'opreturn' | 'data' | 'locktime' | 'fee' | 'destination-tag' | 'txid';
          label?: string;
          value: string;
          value2?: string;
          token?: undefined;
      }
    | {
          type: 'fee-replace';
          label?: undefined;
          value: string;
          value2: string;
          token?: undefined;
      }
    | {
          type: 'reduce-output';
          label: string;
          value: string;
          value2: string;
          token?: undefined;
      };

export type Props = OutputProps & {
    state: IndicatorProps['state'];
    symbol: Network['symbol'];
    account: Account;
};

const Output = (props: Props) => {
    const { type, state, label, value, symbol, token, account } = props;
    let outputLabel: React.ReactNode = label;

    if (type === 'opreturn') {
        outputLabel = <Translation id="OP_RETURN" />;
    }
    if (type === 'locktime') {
        const isTimestamp = new BigNumber(value).gte(BTC_LOCKTIME_VALUE);
        outputLabel = (
            <Translation id={isTimestamp ? 'LOCKTIME_TIMESTAMP' : 'LOCKTIME_BLOCKHEIGHT'} />
        );
    }
    if (type === 'fee') {
        outputLabel = <Translation id="FEE" />;
    }
    if (type === 'destination-tag') {
        outputLabel = <Translation id="DESTINATION_TAG" />;
    }

    let outputValue = value;
    let outputSymbol;
    let fiatVisible = false;
    if (token) {
        outputValue = formatAmount(value, token.decimals);
        outputSymbol = token.symbol as NetworkSymbol;
    } else if (type === 'regular' || type === 'fee') {
        outputValue = formatNetworkAmount(value, symbol);
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
                label: <Translation id="TR_ADDRESS" />,
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
                id: 'default',
                label: <Translation id="DATA_ETH" />,
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
        <OutputElement
            account={account}
            indicator={<Indicator state={state} size={16} />}
            lines={outputLines}
            token={token}
            cryptoSymbol={outputSymbol as NetworkSymbol}
            fiatSymbol={symbol}
            hasExpansion={hasExpansion}
            fiatVisible={fiatVisible}
        />
    );
};

export default Output;
