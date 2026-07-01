import { type ReactNode } from 'react';

import {
    Translation,
    type TranslationFunction,
    type TranslationKey,
    useTranslation,
} from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { isApprovalFlowSupported, selectSelectedDevice } from '@suite-common/device';
import { type Locale, type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { BTC_LOCKTIME_VALUE } from '@suite-common/wallet-constants';
import { selectAccounts } from '@suite-common/wallet-core';
import {
    type EvmTransactionPurpose,
    type ReviewOutput,
    type StakeType,
    type YieldClaimReward,
} from '@suite-common/wallet-types';
import {
    type EvmApprovalPurpose,
    findAccountsByAddress,
    getCardanoFingerprint,
    isEvmApprovalTxByTextSignature,
    isMaxAllowance,
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

const yieldStrings: Record<
    Extract<EvmTransactionPurpose, 'deposit' | 'withdraw' | 'redeem'>,
    Record<'value' | 'label' | 'amount', TranslationKey>
> = {
    deposit: {
        value: 'TR_EARN_YIELD_REVIEW_DEPOSIT_DESCRIPTION',
        label: 'TR_EARN_YIELD_REVIEW_DEPOSIT_TITLE',
        amount: 'TR_EARN_YIELD_REVIEW_DEPOSIT_AMOUNT',
    },
    withdraw: {
        value: 'TR_EARN_YIELD_REVIEW_WITHDRAW_DESCRIPTION',
        label: 'TR_EARN_YIELD_REVIEW_WITHDRAW_TITLE',
        amount: 'TR_EARN_YIELD_REVIEW_WITHDRAW_AMOUNT',
    },
    redeem: {
        value: 'TR_EARN_YIELD_REVIEW_REDEEM_DESCRIPTION',
        label: 'TR_EARN_YIELD_REVIEW_REDEEM_TITLE',
        amount: 'TR_EARN_YIELD_REVIEW_REDEEM_AMOUNT',
    },
};

const isYieldAction = (
    evmTxType: EvmTransactionPurpose | undefined,
): evmTxType is keyof typeof yieldStrings =>
    !!evmTxType && Object.keys(yieldStrings).includes(evmTxType);

const getTranslationValues = (
    networkType: NetworkType,
    stakeType?: StakeType,
    evmTxType?: EvmTransactionPurpose,
    device?: TrezorDevice,
    isTronStakeFreeze?: boolean,
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

    if (isYieldAction(evmTxType)) {
        return yieldStrings[evmTxType];
    }

    if (evmTxType === 'claim') {
        return {
            value: 'TR_EARN_YIELD_REVIEW_CLAIM_TITLE',
            label: 'TR_EARN_YIELD_REVIEW_CLAIM_TITLE',
        };
    }

    if (isTronStakeFreeze) {
        return { value: 'TR_ADDRESS', label: 'TR_ADDRESS' };
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
    receiveAddress?: string,
    isTronStakeFreeze?: boolean,
): ReactNode | undefined => {
    const translation = getTranslationValues(
        networkType,
        stakeType,
        evmTxType,
        device,
        isTronStakeFreeze,
    );
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
            if (evmTxType === 'deposit') {
                return <Translation id="TR_EARN_YIELD_DEPOSIT_TO" />;
            }
            if (evmTxType === 'withdraw') {
                return <Translation id="TR_EARN_YIELD_WITHDRAW_FROM" />;
            }
            if (evmTxType === 'redeem') {
                return <Translation id="TR_EARN_YIELD_REDEEM_FROM" />;
            }

            return <Translation id={translation ? translation.label : 'TR_RECIPIENT_ADDRESS'} />;

        case 'amount':
            if (isYieldAction(evmTxType)) {
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
        case 'note':
            return <Translation id="TR_TRON_NOTE" />;
        case 'data':
            return <Translation id={translation ? translation.label : 'DATA'} />;
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
        case 'swap_intent':
            return <Translation id="TR_TRADING_INTENT" />;
        case 'traded_assets':
            return <Translation id={receiveAddress ? 'TR_CONTRACT' : 'TR_MY_ASSETS'} />;
        case 'fee-limit':
            return <Translation id="TR_SUMMARY" />;
        case 'rewards':
            return <Translation id="TR_REWARD_TOKENS" />;
        case 'tron-vote':
            return <Translation id="TR_SUMMARY" />;
        case 'tron-withdraw':
            return <Translation id="TR_SUMMARY" />;
        case 'tron-claim':
            return <Translation id="TR_STAKE_CLAIM" />;
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
    rewards?: YieldClaimReward[];
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
    rewards,
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
        case 'note': {
            return [
                {
                    id: type,
                    type: 'default',
                    value,
                },
            ];
        }
        case 'address':
        case 'data':
        case 'regular_legacy': {
            const translationValues = getTranslationValues(
                networkType,
                stakeType,
                evmTxType,
                device,
            );

            if (isYieldAction(evmTxType)) {
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

            if (evmTxType === 'claim' && type === 'data') {
                return [
                    {
                        id: 'data',
                        type: 'default',
                        value,
                    },
                ];
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
        case 'swap_intent':
            return [
                {
                    id: 'swap_intent',
                    type: 'data',
                    value: translationString('TR_TRADING_INTENT_SWAP', {}),
                },
            ];
        case 'amount': {
            if (isYieldAction(evmTxType)) {
                return [
                    {
                        id: 'amount',
                        label: <Translation id={yieldStrings[evmTxType].amount} />,
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
            const isMaxApproval = isMaxAllowance(value);
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
        case 'rewards':
            return (rewards ?? []).map(reward => ({
                id: `reward-${reward.tokenAddress}`,
                value: reward.tokenSymbol || reward.tokenAddress,
                type: 'default' as const,
            }));
        case 'tron-vote':
            return [
                {
                    id: 'address',
                    type: 'safe-address',
                    label: <Translation id="TR_ADDRESS" />,
                    value,
                    isChunked: false,
                },
                {
                    id: 'votes',
                    type: 'default',
                    label: <Translation id="TR_TRON_VOTES" />,
                    value: value2,
                },
            ];
        case 'tron-withdraw':
            return [
                {
                    id: 'address',
                    type: 'safe-address',
                    label: <Translation id="TR_EARN_TRON_CLAIM_ADDRESS" />,
                    value,
                },
            ];
        case 'tron-claim':
            return [
                {
                    id: 'tron-claim',
                    type: 'data',
                    value: translationString('TR_EARN_TRON_CLAIM_CONFIRM'),
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
    isTronStakeFreeze?: boolean;
} & ReviewOutput;

export const TransactionReviewOutput = (props: TransactionReviewOutputProps) => {
    const {
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
        isTronStakeFreeze,
    } = props;
    const rewards = type === 'rewards' ? props.rewards : undefined;
    const receiveAddress = type === 'traded_assets' ? props.receiveAddress : undefined;
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
        value ?? '',
        isRbf,
        stakeType,
        evmTxType,
        device,
        receiveAddress,
        isTronStakeFreeze,
    );

    const outputLines = getOutputLines({
        type,
        account,
        value: value ?? '',
        value2,
        label,
        stakeType,
        evmTxType,
        device,
        token,
        rewards,
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
                receiveAddress={receiveAddress}
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
