import { ReactNode } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { TrezorDevice } from '@suite-common/suite-types';
import { NetworkSymbol, NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { selectAccounts, selectSelectedDevice } from '@suite-common/wallet-core';
import { EvmTransactionPurpose, ReviewOutput, StakeType } from '@suite-common/wallet-types';
import { findAccountsByAddress, isTestnet } from '@suite-common/wallet-utils';
import { getFirmwareVersion } from '@trezor/device-utils';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { isNewerOrEqual } from '@trezor/utils/src/versionUtils';

import { Translation } from 'src/components/suite';
import { TransactionReviewOutputAssets } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputAssets';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { TranslationFunction } from 'src/hooks/suite/useTranslation';
import type { Account } from 'src/types/wallet';

import {
    OutputElementLine,
    TransactionReviewOutputElement,
    TransactionReviewOutputElementProps,
} from './TransactionReviewOutputElement';

const getFeeLabel = (networkType: NetworkType) => {
    switch (networkType) {
        case 'ethereum':
            return 'MAX_FEE';
        case 'stellar':
            return 'MAX_FEE';
        case 'solana':
            return 'EXPECTED_FEE';
        default:
            return 'FEE';
    }
};

const getStakeTranslations = (
    stakeType: StakeType,
    networkType: NetworkType,
): Record<'value' | 'label', TranslationKey> => {
    const isEverStake = networkType === 'ethereum';

    const translations: Record<StakeType, Record<'value' | 'label', TranslationKey>> = {
        stake: {
            value: 'TR_STAKE_ON_EVERSTAKE',
            label: 'TR_STAKE_STAKE',
        },
        unstake: {
            value: isEverStake ? 'TR_UNSTAKE_FROM_EVERSTAKE' : 'TR_UNSTAKE_FROM_STAKE_ACCOUNT',
            label: 'TR_STAKE_UNSTAKE',
        },
        claim: {
            value: isEverStake ? 'TR_CLAIM_FROM_EVERSTAKE' : 'TR_CLAIM_FROM_STAKE_ACCOUNT',
            label: 'TR_STAKE_CLAIM',
        },
    };

    return translations[stakeType];
};

const approvalStrings: Record<
    Exclude<EvmTransactionPurpose, 'transfer'>,
    Record<'value' | 'label', TranslationKey>
> = {
    approval: {
        value: 'TR_APPROVE_DESCRIPTION',
        label: 'TR_APPROVE_TITLE',
    },
    revoke: {
        value: 'TR_REVOKE_DESCRIPTION',
        label: 'TR_REVOKE_TITLE',
    },
};

const getTranslationValues = (
    networkType: NetworkType,
    stakeType?: StakeType,
    evmApprovalType?: Exclude<EvmTransactionPurpose, 'transfer'>,
    device?: TrezorDevice,
): Record<'value' | 'label', TranslationKey> | null => {
    const firmwareVersion = getFirmwareVersion(device);
    const isNewApproveFlowSupported = firmwareVersion && isNewerOrEqual(firmwareVersion, '2.9.0');

    if (evmApprovalType && !isNewApproveFlowSupported) {
        return null;
    }

    if (evmApprovalType) {
        return approvalStrings[evmApprovalType];
    }

    if (stakeType) {
        return getStakeTranslations(stakeType, networkType);
    }

    return null;
};

const getContractTitle = (
    networkType: NetworkType,
    evmApprovalType?: Exclude<EvmTransactionPurpose, 'transfer'>,
): TranslationKey => {
    if (evmApprovalType) {
        return evmApprovalType === 'approval'
            ? 'TR_CONTRACT_APPROVE_TITLE'
            : 'TR_CONTRACT_REVOKE_TITLE';
    }

    return networkType === 'solana' ? 'TR_TOKEN' : 'TR_CONTRACT_ADDRESS';
};

const getOutputTitle = (
    type: ReviewOutput['type'],
    networkType: NetworkType,
    value: string,
    isRbf: boolean,
    stakeType: StakeType | undefined,
    evmApprovalType: Exclude<EvmTransactionPurpose, 'transfer'> | undefined,
    device?: TrezorDevice,
): ReactNode | undefined => {
    const translation = getTranslationValues(networkType, stakeType, evmApprovalType, device);
    const contractTitle = getContractTitle(networkType, evmApprovalType);

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
            return <Translation id="TR_TX_FEE" />;
        case 'reduce-output':
            return <Translation id="AMOUNT" />;
        case 'contract':
            return <Translation id={contractTitle} />;
        case 'address':
        case 'regular_legacy':
            return <Translation id={translation ? translation.label : 'TR_RECIPIENT_ADDRESS'} />;

        case 'amount':
            return <Translation id="TR_AMOUNT_SENT" />;
        case 'destination-tag':
            return <Translation id="DESTINATION_TAG" />;
        case 'signing-with':
            return <Translation id="TR_SIGNING_WITH" />;
        case 'network':
            return <Translation id="TR_NETWORK_TITLE" />;
        case 'gas':
            return <Translation id="TR_GAS_PRICE" />;
        case 'txid':
            return <Translation id={isRbf ? 'TR_TXID_RBF' : 'TR_TXID'} />;
        case 'data':
            return <Translation id={translation ? translation.label : 'DATA_ETH'} />;
        case 'opreturn':
            return <Translation id="OP_RETURN" />;
        case 'timebounds':
            return <Translation id="TIME_BOUNDS" />;
        case 'approve_data':
            return (
                <Translation
                    id={
                        evmApprovalType === 'approval'
                            ? 'TR_APPROVE_DATA_TITLE'
                            : 'TR_REVOKE_DATA_TITLE'
                    }
                />
            );
        case 'recipient_name':
            return <Translation id="TR_TRADING_PROVIDER" />;
        case 'traded_assets':
            return <Translation id="TR_MY_ASSETS" />;
        default:
            return exhaustive(type);
    }
};

interface GetOutputLinesParams {
    type: ReviewOutput['type'];
    networkType: NetworkType;
    value: string;
    value2?: string;
    label?: string;
    symbol: NetworkSymbol;
    stakeType?: StakeType;
    evmTxType?: Exclude<EvmTransactionPurpose, 'transfer'>;
    device?: TrezorDevice;
    token?: ReviewOutput['token'];
    translationString: TranslationFunction;
}

const getOutputLines = ({
    type,
    networkType,
    value,
    value2 = '',
    label = '',
    symbol,
    stakeType,
    evmTxType,
    device,
    token,
    translationString,
}: GetOutputLinesParams): OutputElementLine[] => {
    switch (type) {
        case 'gas':
        case 'fee':
            return [
                {
                    id: type,
                    type: 'amount',
                    label: <Translation id="AMOUNT" />,
                    value,
                },
            ];
        case 'fee-replace':
            return [
                {
                    id: 'increase-fee-by',
                    type: 'amount',
                    label: <Translation id="TR_INCREASE_FEE_BY" />,
                    value,
                },
                {
                    id: 'increased-fee',
                    type: 'amount',
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
        case 'regular_legacy': {
            const translation = getTranslationValues(
                networkType,
                stakeType,
                evmTxType,
                device,
            )?.value;

            const defaultOutput = [
                {
                    id: type,
                    type: type === 'regular_legacy' ? 'address' : type,
                    value,
                },
            ];

            if (!translation) {
                return defaultOutput;
            }

            if (evmTxType) {
                return [
                    {
                        id: 'data',
                        type: 'default',
                        value: translationString(translation, {}),
                    },
                ];
            }
            if (stakeType) {
                return [
                    {
                        id: 'data',
                        type: 'default',
                        value: translationString(translation, {
                            symbol: getNetworkDisplaySymbol(symbol),
                        }),
                    },
                ];
            }

            return defaultOutput;
        }
        case 'txid':
        case 'contract':
        case 'opreturn':
        case 'destination-tag':
        case 'locktime':
        case 'timebounds':
        case 'network':
        case 'recipient_name':
        case 'signing-with':
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
        case 'approve_data': {
            const isMaxApproval = new BigNumber(value).eq(UINT256_MAX);
            const isApprovalTx = evmTxType === 'approval';
            const type = isMaxApproval || !isApprovalTx ? 'data' : 'amount';
            const getValue = () => {
                if (!isApprovalTx && token?.symbol) {
                    return token.symbol.toUpperCase();
                }

                return isMaxApproval ? translationString('TR_APPROVE_AMOUNT_UNLIMITED', {}) : value;
            };

            return [
                {
                    id: `${type}-amount`,
                    label: (
                        <Translation
                            id={isApprovalTx ? 'TR_APPROVE_AMOUNT_TITLE' : 'TR_REVOKE_AMOUNT_TITLE'}
                        />
                    ),
                    value: getValue(),
                    type,
                },
                {
                    id: `${type}-chain`,
                    label: <Translation id="TR_APPROVE_CHAIN_TITLE" />,
                    value: value2,
                    type: 'data',
                },
            ];
        }
        // independent component
        case 'traded_assets':
            return [];
        default:
            return exhaustive(type);
    }
};

export type TransactionReviewOutputProps = {
    state: TransactionReviewOutputElementProps['state'];
    account: Account;
    isRbf: boolean;
    stakeType?: StakeType;
    isTrading?: boolean;
    evmTxType?: EvmTransactionPurpose;
} & ReviewOutput;

export const TransactionReviewOutput = ({
    type,
    state,
    label,
    value,
    value2,
    send,
    receive,
    token,
    account,
    stakeType,
    isRbf,
    isTrading,
    evmTxType,
}: TransactionReviewOutputProps) => {
    const { networkType, symbol } = account;
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);

    const { translationString } = useTranslation();
    const isFiatVisible =
        ['fee', 'amount', 'gas', 'fee-replace', 'reduce-output'].includes(type) &&
        !isTestnet(symbol);

    const outputTitle = getOutputTitle(
        type,
        networkType,
        value,
        isRbf,
        stakeType,
        evmTxType !== 'transfer' ? evmTxType : undefined,
        device,
    );

    const outputLines = getOutputLines({
        type,
        networkType,
        value,
        value2,
        label,
        symbol,
        stakeType,
        evmTxType: evmTxType !== 'transfer' ? evmTxType : undefined,
        device,
        token,
        translationString,
    }).map(line => {
        if (line.type === 'address') {
            const relevantAccounts = findAccountsByAddress(symbol, line.value, accounts);

            return {
                ...line,
                type:
                    isTrading || stakeType || relevantAccounts.length > 0
                        ? ('safe-address' as OutputElementLine['type'])
                        : line.type,
            };
        }

        if (type === 'timebounds') {
            return {
                ...line,
                value: translationString('TIME_BOUNDS_IS_NOT_SET'),
            };
        }

        if (type === 'network') {
            return {
                ...line,
                value: translationString('TR_NETWORK_TESTNET'),
            };
        }

        if (type === 'destination-tag' && value === '') {
            return {
                ...line,
                value: translationString('DESTINATION_TAG_NOT_SET'),
            };
        }

        return line;
    });

    // prevents double label when bumping stake type txs
    const ignoredRbfTypes = ['address', 'regular_legacy'];
    if (isRbf && stakeType && ignoredRbfTypes.includes(type)) {
        return null;
    }

    if (type === 'traded_assets') {
        return (
            <TransactionReviewOutputAssets
                title={outputTitle}
                state={state}
                send={send}
                receive={receive}
            />
        );
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
