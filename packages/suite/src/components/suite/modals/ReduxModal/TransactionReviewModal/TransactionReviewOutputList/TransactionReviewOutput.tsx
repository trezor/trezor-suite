import { ReactNode, forwardRef } from 'react';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { Translation } from 'src/components/suite';
import { formatNetworkAmount, formatAmount, isTestnet } from '@suite-common/wallet-utils';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { ReviewOutput } from '@suite-common/wallet-types';
import {
    TransactionReviewStepIndicator,
    TransactionReviewStepIndicatorProps,
} from './TransactionReviewStepIndicator';
import {
    TransactionReviewOutputElement,
    OutputElementLine,
} from './TransactionReviewOutputElement';
import type { Account } from 'src/types/wallet';
import { StakeType } from '@suite-common/wallet-types';
import { useDisplayMode, useTranslation } from 'src/hooks/suite';
import { TranslationKey } from '@suite-common/intl-types';

const getFeeLabel = (networkType: Account['networkType']) => {
    switch (networkType) {
        case 'ethereum':
            return 'MAX_FEE';
        case 'solana':
            return 'EXPECTED_FEE';
        default:
            return 'FEE';
    }
};

const getDisplayModeStringsMap = (): Record<
    StakeType,
    { value: TranslationKey; confirmLabel: TranslationKey }
> => ({
    stake: {
        value: 'TR_STAKE_ON_EVERSTAKE',
        confirmLabel: 'TR_STAKE_STAKE',
    },
    unstake: {
        value: 'TR_UNSTAKE_FROM_EVERSTAKE',
        confirmLabel: 'TR_STAKE_UNSTAKE',
    },
    claim: {
        value: 'TR_CLAIM_FROM_EVERSTAKE',
        confirmLabel: 'TR_STAKE_CLAIM',
    },
});

export type TransactionReviewOutputProps = {
    state: TransactionReviewStepIndicatorProps['state'];
    symbol: NetworkSymbol;
    account: Account;
    isRbf: boolean;
    ethereumStakeType?: StakeType;
} & ReviewOutput;

export const TransactionReviewOutput = forwardRef<HTMLDivElement, TransactionReviewOutputProps>(
    (props, ref) => {
        const { type, state, label, value, symbol, token, account, ethereumStakeType } = props;
        let outputLabel: ReactNode = label;
        const { networkType } = account;
        const { translationString } = useTranslation();
        const displayMode = useDisplayMode({ ethereumStakeType, type });

        if (type === 'locktime') {
            const isTimestamp = new BigNumber(value).gte(BTC_LOCKTIME_VALUE);
            outputLabel = (
                <Translation id={isTimestamp ? 'LOCKTIME_TIMESTAMP' : 'LOCKTIME_BLOCKHEIGHT'} />
            );
        }
        if (type === 'fee') {
            outputLabel = <Translation id={getFeeLabel(networkType)} />;
        }
        if (type === 'contract') {
            if (networkType === 'solana') {
                outputLabel = <Translation id="TR_TOKEN" />;
            } else {
                outputLabel = <Translation id="TR_CONTRACT" />;
            }
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
                    label: <Translation id={props.isRbf ? 'TR_TXID_RBF' : 'TR_TXID'} />,
                    value: outputValue,
                    plainValue: true,
                },
            ];
        } else if (['data', 'address'].includes(type) && ethereumStakeType) {
            const displayModeStringsMap = getDisplayModeStringsMap();

            outputLines = [
                {
                    id: 'data',
                    label: translationString(
                        displayModeStringsMap[ethereumStakeType].confirmLabel,
                        {
                            symbol: symbol.toUpperCase(),
                        },
                    ),
                    value: translationString(displayModeStringsMap[ethereumStakeType].value, {
                        symbol: symbol.toUpperCase(),
                    }),
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

        return (
            <TransactionReviewOutputElement
                ref={ref}
                account={account}
                indicator={<TransactionReviewStepIndicator state={state} size={16} />}
                lines={outputLines}
                token={token}
                state={state}
                cryptoSymbol={outputSymbol as NetworkSymbol}
                fiatSymbol={symbol}
                fiatVisible={fiatVisible}
                displayMode={displayMode}
            />
        );
    },
);
