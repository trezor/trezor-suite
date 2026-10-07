import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { type SignOperator } from '@suite-common/suite-types';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type Timestamp } from '@suite-common/wallet-types';
import {
    formatCardanoDeposit,
    formatCardanoWithdrawal,
    formatNetworkAmount,
    getCardanoStakingSignValue,
    getFiatRateKey,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, FormattedCryptoAmount, Sign } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useHistoricFiatRateAt } from 'src/hooks/wallet/transactions/HistoricFiatRatesContext';
import { type WalletAccountTransaction } from 'src/types/wallet';

import { TransactionTargetLayout } from './TransactionTargetLayout';

type CustomRowProps = {
    amount: string;
    sign: SignOperator;
    title: ExtendedMessageDescriptor['id'];
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
};

export const CustomRow = ({
    transaction,
    title,
    amount,
    sign,
    useFiatValues,
    ...baseLayoutProps
}: CustomRowProps) => {
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useHistoricFiatRateAt(fiatRateKey, transaction.blockTime as Timestamp);

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            addressLabel={<Translation id={title} />}
            amount={
                <FormattedCryptoAmount
                    value={amount}
                    symbol={transaction.symbol}
                    signValue={sign}
                />
            }
            fiatAmount={
                useFiatValues && historicRate ? (
                    <>
                        <Sign value={sign} grayscale />
                        <BaseCurrencyValue
                            amount={amount}
                            symbol={transaction.symbol}
                            historicRate={historicRate}
                            useHistoricRate
                        />
                    </>
                ) : undefined
            }
        />
    );
};

type FeeRowProps = {
    fee: string;
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
};

export const FeeRow = ({ fee, transaction, useFiatValues, ...baseLayoutProps }: FeeRowProps) => (
    <CustomRow
        {...baseLayoutProps}
        title="FEE"
        sign="negative"
        amount={fee}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

type WithdrawalRowProps = {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
};

export const WithdrawalRow = ({
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: WithdrawalRowProps) => (
    <CustomRow
        {...baseLayoutProps}
        title="TR_TX_WITHDRAWAL"
        sign="positive"
        amount={formatCardanoWithdrawal(transaction) ?? '0'}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

type DepositRowProps = {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
};

export const DepositRow = ({ transaction, useFiatValues, ...baseLayoutProps }: DepositRowProps) => (
    <CustomRow
        {...baseLayoutProps}
        title="TR_TX_DEPOSIT"
        sign={getCardanoStakingSignValue(transaction)}
        amount={formatCardanoDeposit(transaction) ?? '0'}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

type CoinjoinRowProps = {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
};

export const CoinjoinRow = ({ transaction, useFiatValues }: CoinjoinRowProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, baseCurrencyCode);
    const historicRate = useHistoricFiatRateAt(fiatRateKey, transaction.blockTime as Timestamp);

    return (
        <TransactionTargetLayout
            fiatAmount={
                useFiatValues ? (
                    <BaseCurrencyValue
                        amount={formatNetworkAmount(
                            new BigNumber(transaction.amount).abs().toString(),
                            transaction.symbol,
                        )}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                    />
                ) : undefined
            }
            addressLabel={
                <Translation
                    id="TR_JOINT_TRANSACTION_TARGET"
                    values={{
                        in: transaction.details.vin.length,
                        inMy: transaction.details.vin.filter(v => v.isAccountOwned).length,
                        out: transaction.details.vout.length,
                        outMy: transaction.details.vout.filter(v => v.isAccountOwned).length,
                    }}
                />
            }
        />
    );
};
