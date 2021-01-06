import React from 'react';
import BigNumber from 'bignumber.js';
import { Translation } from '@suite-components';
import { formatNetworkAmount, formatAmount, isTestnet } from '@wallet-utils/accountUtils';
import { BTC_LOCKTIME_VALUE } from '@wallet-constants/sendForm';
import { Network } from '@wallet-types';
import { TokenInfo } from 'trezor-connect';
import Indicator, { Props as IndicatorProps } from './Indicator';
import OutputElement, { OutputElementLine } from './OutputElement';

export type OutputProps =
    | {
          type: 'regular';
          label: string;
          value: string;
          value2?: undefined;
          token?: TokenInfo;
      }
    | {
          type:
              | 'opreturn'
              | 'data'
              | 'locktime'
              | 'fee'
              | 'destination-tag'
              | 'txid'
              | 'fee-replace';
          label?: string;
          value: string;
          value2?: string;
          token?: undefined;
      };

export type Props = OutputProps & {
    state: IndicatorProps['state'];
    symbol: Network['symbol'];
};

const Output = ({ type, state, label, value, value2, symbol, token }: Props) => {
    let outputLabel: React.ReactNode = label;

    if (type === 'opreturn') {
        outputLabel = <Translation id="OP_RETURN" />;
    }
    if (type === 'data') {
        outputLabel = <Translation id="DATA_ETH" />;
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
        outputSymbol = token.symbol;
    } else if (type === 'regular' || type === 'fee') {
        outputValue = formatNetworkAmount(value, symbol);
        outputSymbol = symbol;
        fiatVisible = !isTestnet(symbol);
    }

    let outputLines: OutputElementLine[];

    if (type === 'fee-replace' && value2) {
        outputLines = [
            {
                label: <Translation id="TR_INCREASE_FEE_BY" />,
                value: formatNetworkAmount(value, symbol),
            },
            {
                label: <Translation id="TR_INCREASED_FEE" />,
                value: formatNetworkAmount(value2, symbol),
            },
        ];
        outputSymbol = symbol;
        fiatVisible = !isTestnet(symbol);
    } else {
        outputLines = [
            {
                label: outputLabel,
                value: outputValue,
            },
        ];
    }

    const hasExpansion = (type === 'opreturn' || type === 'data') && outputValue.length >= 10;

    return (
        <OutputElement
            indicator={<Indicator state={state} size={16} />}
            lines={outputLines}
            cryptoSymbol={outputSymbol}
            fiatSymbol={symbol}
            hasExpansion={hasExpansion}
            fiatVisible={fiatVisible}
        />
    );
};

export default Output;
