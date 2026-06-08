import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type FiatRatesRootState,
    type Target,
    type WalletSettingsRootState,
} from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getTargetAmountRaw } from '@suite-common/wallet-utils';
import {
    CryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    SignValueFormatter,
    TokenAmountFormatter,
    TokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { type TypedTokenTransfer, type WalletAccountTransaction } from '@suite-native/tokens';
import { getTransactionValueSign, selectTransactionFiatRate } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TransactionDetailTargetsSection } from './TransactionDetailTargetsSection';

type ToRenderComponentTypes = TypedTokenTransfer | WalletAccountTransaction | Target[];

type TransactionDetailTargetsProps = {
    isPhishingTransaction?: boolean;
    toRender: ToRenderComponentTypes;
    iconComponent: React.ReactNode;
    transaction: WalletAccountTransaction;
    tokenTransfer?: TypedTokenTransfer;
};

type TokenTransferProps = {
    transaction: WalletAccountTransaction;
    tokenTransfer: TypedTokenTransfer;
};

const failedTxStyle = prepareNativeStyle<{ isFailedTx: boolean }>((_, { isFailedTx }) => ({
    extend: {
        condition: isFailedTx,
        style: {
            textDecorationLine: 'line-through',
        },
    },
}));

const isTokenTransfer = (toRender: ToRenderComponentTypes): toRender is TypedTokenTransfer =>
    (toRender as TypedTokenTransfer).from !== undefined;

const TokenTransfer = ({ tokenTransfer, transaction }: TokenTransferProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const signValue = getTransactionValueSign(tokenTransfer?.type ?? transaction.type);

    return (
        <>
            {!isFailedTx && (
                <SignValueFormatter
                    color="contentPrimary"
                    value={signValue}
                    variant="headline-md"
                />
            )}

            <TokenAmountFormatter
                value={tokenTransfer.amount}
                tokenSymbol={tokenTransfer.symbol}
                decimals={tokenTransfer.decimals}
                variant="headline-md"
                color="contentPrimary"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={applyStyle(failedTxStyle, { isFailedTx })}
            />
        </>
    );
};

const TokenFiatTransfer = ({ tokenTransfer, transaction }: TokenTransferProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction, tokenTransfer?.contract),
    );

    if (!historicRate || historicRate === 0) return;

    return (
        <>
            <TokenToFiatAmountFormatter
                symbol={transaction.symbol}
                contract={tokenTransfer.contract}
                value={tokenTransfer.amount}
                decimals={tokenTransfer.decimals}
                historicRate={historicRate}
                color="contentSecondary"
                useHistoricRate
                style={applyStyle(failedTxStyle, { isFailedTx })}
            />
        </>
    );
};

const hasTarget = (toRender: ToRenderComponentTypes): toRender is Target[] =>
    Array.isArray(toRender) && toRender.every(v => (v as Target).payload !== undefined);

type TargetCryptoProps = {
    transaction: WalletAccountTransaction;
    amount: string;
};

type TargetFiatProps = {
    transaction: WalletAccountTransaction;
    amount: string;
    contract?: TokenAddress;
};

const findInternalAmountChanges = (targets: Target[]) => {
    for (const target of targets) {
        if (target.type === 'internal' && target.payload) {
            return target;
        }
    }

    return null;
};

const findTargetAmountChanges = (targets: Target[], transaction: WalletAccountTransaction) => {
    for (const target of targets) {
        if (target.type === 'target' && getTargetAmountRaw(target.payload, transaction)) {
            return target;
        }
    }

    return null;
};

const TargetCrypto = ({ transaction, amount }: TargetCryptoProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const isSolanaUnstakeTx = transaction?.solanaSpecific?.stakeOperation?.type === 'unstake';
    const signValue = getTransactionValueSign(transaction.type);

    if (isSolanaUnstakeTx) return;

    return (
        <>
            {!isFailedTx && (
                <SignValueFormatter
                    color="contentPrimary"
                    value={signValue}
                    variant="headline-md"
                />
            )}

            <CryptoAmountFormatter
                value={amount}
                symbol={transaction.symbol}
                isBalance={false}
                variant="headline-md"
                color="contentPrimary"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={applyStyle(failedTxStyle, { isFailedTx })}
            />
        </>
    );
};

const TargetFiat = ({ transaction, amount, contract }: TargetFiatProps) => {
    const { applyStyle } = useNativeStyles();
    const isFailedTx = transaction.type === 'failed';
    const historicRate = useSelector((state: WalletSettingsRootState & FiatRatesRootState) =>
        selectTransactionFiatRate(state, transaction, contract),
    );

    if (!historicRate || historicRate === 0) return;

    return (
        <>
            <CryptoToFiatAmountFormatter
                value={amount}
                symbol={transaction.symbol}
                historicRate={historicRate}
                color="contentSecondary"
                useHistoricRate
                style={applyStyle(failedTxStyle, { isFailedTx })}
            />
        </>
    );
};

export const getToRenderComponentType = (
    toRender: ToRenderComponentTypes,
    transaction: WalletAccountTransaction,
    tokenTransfer?: TypedTokenTransfer,
) => {
    const toRenderIsTokenTransfer = isTokenTransfer(toRender);

    if (toRenderIsTokenTransfer) {
        return {
            topTarget: <TokenTransfer tokenTransfer={toRender} transaction={transaction} />,
            bottomTarget: <TokenFiatTransfer tokenTransfer={toRender} transaction={transaction} />,
        };
    }

    const toRenderIsTarget = hasTarget(toRender);

    if (toRenderIsTarget) {
        const target = findTargetAmountChanges(toRender, transaction);

        if (target) {
            const amount = getTargetAmountRaw(target.payload, transaction);

            if (amount) {
                return {
                    topTarget: (
                        <TargetCrypto amount={amount.toString()} transaction={transaction} />
                    ),
                    bottomTarget: (
                        <TargetFiat
                            amount={amount.toString()}
                            contract={tokenTransfer?.contract}
                            transaction={transaction}
                        />
                    ),
                };
            }
        }

        const internalAmountChange = findInternalAmountChanges(toRender);

        if (internalAmountChange) {
            return {
                topTarget: (
                    <TargetCrypto
                        amount={internalAmountChange?.payload.amount}
                        transaction={transaction}
                    />
                ),
                bottomTarget: (
                    <TargetFiat
                        amount={internalAmountChange?.payload.amount}
                        contract={tokenTransfer?.contract}
                        transaction={transaction}
                    />
                ),
            };
        }
    }

    return {
        topTarget: null,
        bottomTarget: null,
    };
};

export const TransactionDetailTargets = ({
    transaction,
    tokenTransfer,
    toRender,
    iconComponent,
}: TransactionDetailTargetsProps) => {
    const { topTarget, bottomTarget } = useMemo(
        () => getToRenderComponentType(toRender, transaction, tokenTransfer),
        [toRender, transaction, tokenTransfer],
    );

    return (
        <TransactionDetailTargetsSection
            topTarget={topTarget}
            bottomTarget={bottomTarget}
            icon={iconComponent}
        ></TransactionDetailTargetsSection>
    );
};
