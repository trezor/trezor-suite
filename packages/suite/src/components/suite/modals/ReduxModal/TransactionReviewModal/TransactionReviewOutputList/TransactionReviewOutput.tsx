import { type ReactNode } from 'react';

import {
    Translation,
    type TranslationFunction,
    type TranslationKey,
    useTranslation,
} from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { isApprovalFlowSupported, selectSelectedDevice } from '@suite-common/device';
import { UINT256_MAX } from '@suite-common/suite-constants';
import { type Locale, type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { selectAccounts } from '@suite-common/wallet-core';
import {
    type EvmTransactionPurpose,
    type ReviewOutput,
    type StakeType,
} from '@suite-common/wallet-types';
import {
    type EvmApprovalPurpose,
    findAccountsByAddress,
    getCardanoFingerprint,
    isEvmApprovalTxByTextSignature,
    isTestnet,
    localizeNumber,
} from '@suite-common/wallet-utils';
import type { TokenInfo } from '@trezor/blockchain-link-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { TransactionReviewOutputAssets } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputAssets';
import { useSelector } from 'src/hooks/suite';
import type { Account } from 'src/types/wallet';

import {
    type OutputElementLine,
    TransactionReviewOutputElement,
    type TransactionReviewOutputElementProps,
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
        'change-delegate': {
            value: 'TR_STAKE_CHANGE_YOUR_DELEGATE',
            label: 'TR_STAKE_CHANGE_DELEGATE',
        },
    };

    return translations[stakeType];
};

const approvalStrings: Record<EvmApprovalPurpose, Record<'value' | 'label', TranslationKey>> = {
    approve: {
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
    evmTxType?: EvmTransactionPurpose,
    device?: TrezorDevice,
): Record<'value' | 'label', TranslationKey> | null => {
    const isEvmApproval = isEvmApprovalTxByTextSignature(evmTxType);

    if (isEvmApproval && !isApprovalFlowSupported(device)) {
        return null;
    }

    if (isEvmApproval) {
        return approvalStrings[evmTxType];
    }

    if (stakeType) {
        return getStakeTranslations(stakeType, networkType);
    }

    if (evmTxType === 'supply' || evmTxType === 'withdraw') {
        const isSupply = evmTxType === 'supply';

        return {
            label: isSupply
                ? 'TR_EARN_YIELD_REVIEW_SUPPLY_TITLE'
                : 'TR_EARN_YIELD_REVIEW_WITHDRAW_TITLE',
            value: isSupply
                ? 'TR_EARN_YIELD_REVIEW_SUPPLY_DESCRIPTION'
                : 'TR_EARN_YIELD_REVIEW_WITHDRAW_DESCRIPTION',
        };
    }

    return null;
};

const getContractTitle = (
    networkType: NetworkType,
    isApprovalFlowSupported: boolean,
    evmTxType?: EvmTransactionPurpose,
): TranslationKey => {
    const isEvmApproval = isEvmApprovalTxByTextSignature(evmTxType);

    if (isEvmApproval && isApprovalFlowSupported) {
        return evmTxType === 'approve' ? 'TR_CONTRACT_APPROVE_TITLE' : 'TR_CONTRACT_REVOKE_TITLE';
    }

    return networkType === 'solana' ? 'TR_TOKEN' : 'TR_CONTRACT_ADDRESS';
};

const getOutputTitle = (
    type: ReviewOutput['type'],
    networkType: NetworkType,
    value: string,
    isRbf: boolean,
    stakeType: StakeType | undefined,
    evmTxType?: EvmTransactionPurpose,
    device?: TrezorDevice,
): ReactNode | undefined => {
    const translation = getTranslationValues(networkType, stakeType, evmTxType, device);
    const contractTitle = getContractTitle(networkType, isApprovalFlowSupported(device), evmTxType);

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
            if (evmTxType === 'supply' || evmTxType === 'withdraw') {
                return <Translation id="TR_EARN_YIELD_VAULT" />;
            }

            return <Translation id={translation ? translation.label : 'TR_RECIPIENT_ADDRESS'} />;

        case 'amount':
            if (evmTxType === 'supply' || evmTxType === 'withdraw') {
                return <Translation id="AMOUNT" />;
            }

            return <Translation id={translation ? translation.label : 'TR_AMOUNT_SENT'} />;
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
                    id={evmTxType === 'approve' ? 'TR_APPROVE_DATA_TITLE' : 'TR_REVOKE_DATA_TITLE'}
                />
            );
        case 'recipient_name':
            return <Translation id="TR_TRADING_PROVIDER" />;
        case 'traded_assets':
            return <Translation id="TR_MY_ASSETS" />;
        case 'fee-limit':
            return <Translation id="TR_SUMMARY" />;
        default:
            return exhaustive(type);
    }
};

interface GetOutputLinesParams {
    type: ReviewOutput['type'];
    account: Account;
    value: string;
    value2?: string;
    label?: string;
    stakeType?: StakeType;
    evmTxType?: EvmTransactionPurpose;
    device?: TrezorDevice;
    token?: ReviewOutput['token'];
    nativeToken?: TokenInfo;
    translationString: TranslationFunction;
    locale: Locale;
}

const getOutputLines = ({
    type,
    account,
    value,
    value2 = '',
    label = '',
    stakeType,
    evmTxType,
    device,
    token,
    nativeToken,
    translationString,
    locale,
}: GetOutputLinesParams): OutputElementLine[] => {
    const { networkType, symbol } = account;

    switch (type) {
        case 'gas':
        case 'fee':
            return [
                {
                    id: type,
                    type: 'amount',
                    label: <Translation id="AMOUNT" />,
                    value,
                    token: nativeToken,
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
            const translationValues = getTranslationValues(
                networkType,
                stakeType,
                evmTxType,
                device,
            );

            if (evmTxType === 'supply' || evmTxType === 'withdraw') {
                if (type === 'data' && translationValues) {
                    return [
                        {
                            id: 'data',
                            type: 'default',
                            value: translationString(translationValues.value, {}),
                        },
                    ];
                }

                if (type === 'address') {
                    return [
                        {
                            id: 'address',
                            type: 'default',
                            value,
                        },
                    ];
                }
            }

            const translation = translationValues?.value;

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

            const isEvmApproval = isEvmApprovalTxByTextSignature(evmTxType);
            if (isEvmApproval) {
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
        case 'amount': {
            if (evmTxType === 'supply' || evmTxType === 'withdraw') {
                return [
                    {
                        id: 'amount',
                        label: (
                            <Translation
                                id={
                                    evmTxType === 'supply'
                                        ? 'TR_EARN_YIELD_REVIEW_SUPPLY_AMOUNT'
                                        : 'TR_EARN_YIELD_REVIEW_WITHDRAW_AMOUNT'
                                }
                            />
                        ),
                        value,
                        type: 'amount',
                        token: token || nativeToken,
                    },
                    {
                        id: 'chain',
                        label: <Translation id="TR_CHAIN" />,
                        value: value2,
                        type: 'data',
                    },
                ];
            }

            const output: OutputElementLine[] = [
                {
                    id: type,
                    label: <Translation id="AMOUNT" />,
                    value,
                    type: 'amount',
                    token: token || nativeToken,
                },
            ];
            if (networkType === 'cardano' && token) {
                const fingerprint = getCardanoFingerprint(account?.tokens, token?.symbol);
                if (fingerprint) {
                    output.push({
                        id: 'cardano-fingerprint',
                        label: <Translation id="TR_CARDANO_FINGERPRINT_HEADLINE" />,
                        value: fingerprint,
                        type: 'default',
                    });
                }
                if (token.decimals !== 0) {
                    output.push({
                        id: 'cardano-trezor-amount',
                        label: <Translation id="TR_CARDANO_TREZOR_AMOUNT_HEADLINE" />,
                        value,
                        type: 'default',
                    });
                }
            }

            return output;
        }
        case 'approve_data': {
            const isMaxApproval = new BigNumber(value).eq(UINT256_MAX);
            const isApprovalTx = evmTxType === 'approve';
            const type = isMaxApproval || !isApprovalTx ? 'data' : 'amount';
            const getValue = () => {
                if (!isApprovalTx && token?.symbol) {
                    return token.symbol;
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
                    token,
                    type,
                },
                {
                    id: `${type}-chain`,
                    label: <Translation id="TR_CHAIN" />,
                    value: value2,
                    type: 'data',
                },
            ];
        }
        // independent component
        case 'traded_assets':
            return [];
        case 'fee-limit':
            return [
                {
                    id: 'fee-limit',
                    label: <Translation id="TR_FEE_LIMIT" />,
                    type: 'default' as const,
                    value: `${localizeNumber(value, locale)} SUN`,
                },
            ];
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
    nativeToken?: TokenInfo;
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
    nativeToken,
}: TransactionReviewOutputProps) => {
    const { networkType, symbol } = account;
    const accounts = useSelector(selectAccounts);
    const device = useSelector(selectSelectedDevice);
    const locale = useSelector(selectLanguage);

    const { translationString } = useTranslation();
    const isFiatVisible =
        ['fee', 'amount', 'gas', 'fee-replace', 'reduce-output'].includes(type) &&
        !isTestnet(symbol) &&
        !nativeToken;

    const outputTitle = getOutputTitle(
        type,
        networkType,
        value,
        isRbf,
        stakeType,
        evmTxType,
        device,
    );

    const outputLines = getOutputLines({
        type,
        account,
        value,
        value2,
        label,
        stakeType,
        evmTxType,
        device,
        token,
        translationString,
        nativeToken,
        locale,
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
            state={state}
            fiatVisible={isFiatVisible}
        />
    );
};
