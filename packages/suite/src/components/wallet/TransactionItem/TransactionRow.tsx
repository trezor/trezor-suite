import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { type SignOperator } from '@suite-common/suite-types';
import { selectBaseCurrency, selectHistoricFiatRatesByTimestamp } from '@suite-common/wallet-core';
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
import { type WalletAccountTransaction } from 'src/types/wallet';

import { TransactionTargetLayout } from './TransactionTargetLayout';

export const CustomRow = ({
    transaction,
    title,
    amount,
    sign,
    useFiatValues,
    ...baseLayoutProps
}: {
    amount: string;
    sign: SignOperator;
    title: ExtendedMessageDescriptor['id'];
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
}) => {
    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            addressLabel={<Translation id={title} />}
            amount={
                <FormattedCryptoAmount
                    value={amount}
                    symbol={transaction.symbol}
                    signValue={sign}
                    signGrayscale
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

export const FeeRow = ({
    fee,
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: {
    fee: string;
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
}) => (
    <CustomRow
        {...baseLayoutProps}
        title="FEE"
        sign="negative"
        amount={fee}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

export const WithdrawalRow = ({
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
}) => (
    <CustomRow
        {...baseLayoutProps}
        title="TR_TX_WITHDRAWAL"
        sign="positive"
        amount={formatCardanoWithdrawal(transaction) ?? '0'}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

export const DepositRow = ({
    transaction,
    useFiatValues,
    ...baseLayoutProps
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
}) => (
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
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

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
