import { ReactNode } from 'react';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { isTestnet } from '@suite-common/wallet-utils';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { getNetworkDisplaySymbol, NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { ReviewOutput, StakeType } from '@suite-common/wallet-types';
import { TranslationKey } from '@suite-common/intl-types';

import type { Account } from 'src/types/wallet';
import { useTranslation } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';

import {
    TransactionReviewOutputElement,
    TransactionReviewOutputElementProps,
    OutputElementLine,
} from './TransactionReviewOutputElement';

const getFeeLabel = (networkType: NetworkType) => {
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
    { value: TranslationKey; label: TranslationKey }
> => ({
    stake: {
        value: 'TR_STAKE_ON_EVERSTAKE',
        label: 'TR_STAKE_STAKE',
    },
    unstake: {
        value: 'TR_UNSTAKE_FROM_EVERSTAKE',
        label: 'TR_STAKE_UNSTAKE',
    },
    claim: {
        value: 'TR_CLAIM_FROM_EVERSTAKE',
        label: 'TR_STAKE_CLAIM',
    },
});

const getOutputTitle = (
    type: ReviewOutput['type'],
    networkType: NetworkType,
    value: string,
    isRbf: boolean,
    stakeType: StakeType | undefined,
): ReactNode | undefined => {
    const displayModeStringsMap = getDisplayModeStringsMap();

    switch (type) {
        case 'locktime': {
            const label = new BigNumber(value).gte(BTC_LOCKTIME_VALUE)
                ? 'LOCKTIME_TIMESTAMP'
                : 'LOCKTIME_BLOCKHEIGHT';

            return <Translation id={label} />;
        }
        case 'fee':
            return <Translation id={getFeeLabel(networkType)} />;
        case 'fee-replace':
        case 'reduce-output':
            return <Translation id="TR_SUMMARY" />;
        case 'contract':
            return <Translation id={networkType === 'solana' ? 'TR_TOKEN' : 'TR_CONTRACT'} />;
        case 'address':
            return (
                <Translation
                    id={stakeType ? displayModeStringsMap[stakeType].label : 'TR_RECIPIENT_ADDRESS'}
                />
            );
        case 'regular_legacy':
            return <Translation id="TR_RECIPIENT_ADDRESS" />;
        case 'amount':
            return <Translation id="TR_AMOUNT_SENT" />;
        case 'destination-tag':
            return <Translation id="DESTINATION_TAG" />;
        case 'gas':
            return <Translation id="TR_GAS_PRICE" />;
        case 'txid':
            return <Translation id={isRbf ? 'TR_TXID_RBF' : 'TR_TXID'} />;
        case 'data':
            return (
                <Translation id={stakeType ? displayModeStringsMap[stakeType].label : 'DATA_ETH'} />
            );
        case 'opreturn':
            return <Translation id="OP_RETURN" />;
        default: {
            const _unhandledCase: never = type;
            throw new Error(`Unhandled output type: ${_unhandledCase}`);
        }
    }
};

const getOutputLines = (
    type: ReviewOutput['type'],
    value: string,
    value2: string = '',
    label: string = '',
    symbol: NetworkSymbol,
    stakeType: StakeType | undefined,
    translationString: (key: TranslationKey, values: any) => string,
): OutputElementLine[] => {
    const displayModeStringsMap = getDisplayModeStringsMap();

    switch (type) {
        case 'gas':
        case 'fee':
            return [
                {
                    id: type,
                    type: 'fee',
                    value,
                },
            ];
        case 'fee-replace':
            return [
                {
                    id: 'increase-fee-by',
                    type: 'fee',
                    label: <Translation id="TR_INCREASE_FEE_BY" />,
                    value,
                },
                {
                    id: 'increased-fee',
                    type: 'fee',
                    label: <Translation id="TR_INCREASED_FEE" />,
                    value: value2,
                },
            ];
        case 'reduce-output':
            return [
                {
                    id: 'decrease-address',
                    type: 'address',
                    label: <Translation id="TR_RECIPIENT_ADDRESS" />,
                    value: label,
                },
                {
                    id: 'decrease-by',
                    type: 'amount',
                    label: <Translation id="TR_DECREASE_AMOUNT_BY" />,
                    value,
                },
                {
                    id: 'decreased-amount',
                    type: 'amount',
                    label: <Translation id="TR_DECREASED_AMOUNT" />,
                    value: value2,
                },
            ];
        case 'address':
        case 'data':
            if (stakeType) {
                return [
                    {
                        id: 'data',
                        type: 'default',
                        value: translationString(displayModeStringsMap[stakeType].value, {
                            symbol: getNetworkDisplaySymbol(symbol),
                        }),
                    },
                ];
            }

            return [
                {
                    id: type,
                    type,
                    value,
                },
            ];
        case 'regular_legacy':
            return [
                {
                    id: type,
                    type: 'address',
                    value,
                },
            ];
        case 'txid':
        case 'contract':
        case 'opreturn':
        case 'destination-tag':
        case 'locktime':
            return [
                {
                    id: type,
                    type: 'data',
                    value,
                },
            ];
        case 'amount':
            return [
                {
                    id: type,
                    label: <Translation id="AMOUNT" />,
                    value,
                    type: 'amount',
                },
            ];
        default: {
            const _unhandledCase: never = type;
            throw new Error(`Unhandled output type: ${_unhandledCase}`);
        }
    }
};

export type TransactionReviewOutputProps = {
    state: TransactionReviewOutputElementProps['state'];
    account: Account;
    isRbf: boolean;
    stakeType?: StakeType;
} & ReviewOutput;

export const TransactionReviewOutput = ({
    type,
    state,
    label,
    value,
    value2,
    token,
    account,
    stakeType,
    isRbf,
}: TransactionReviewOutputProps) => {
    const { networkType, symbol } = account;
    const { translationString } = useTranslation();
    const isFiatVisible =
        ['fee', 'amount', 'gas', 'fee-replace', 'reduce-output'].includes(type) &&
        !isTestnet(symbol);

    const outputTitle = getOutputTitle(type, networkType, value, isRbf, stakeType);

    const outputLines = getOutputLines(
        type,
        value,
        value2,
        label,
        symbol,
        stakeType,
        translationString,
    );

    // prevents double label when bumping stake type txs
    if (type === 'address' && isRbf && stakeType) {
        return null;
    }

    return (
        <TransactionReviewOutputElement
            title={outputTitle}
            account={account}
            lines={outputLines}
            token={token}
            state={state}
            fiatVisible={isFiatVisible}
        />
    );
};
