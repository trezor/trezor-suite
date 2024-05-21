import BigNumber from 'bignumber.js';
import { FiatValue, Translation } from 'src/components/suite';
import {
    formatCardanoWithdrawal,
    formatCardanoDeposit,
    formatNetworkAmount,
    getFiatRateKey,
} from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from 'src/types/wallet';
import { TransactionTargetLayout } from './TransactionTargetLayout';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { SignOperator } from '@suite-common/suite-types';
import { StyledFormattedCryptoAmount } from './CommonComponents';
import { useSelector } from 'src/hooks/suite';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { Timestamp } from '@suite-common/wallet-types';
import { selectHistoricFiatRatesByTimestamp } from '@suite-common/wallet-core';

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
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}) => {
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    return (
        <TransactionTargetLayout
            {...baseLayoutProps}
            addressLabel={<Translation id={title} />}
            amount={
                <StyledFormattedCryptoAmount
                    value={amount}
                    symbol={transaction.symbol}
                    signValue={sign}
                />
            }
            fiatAmount={
                useFiatValues ? (
                    <FiatValue
                        amount={amount}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                    />
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
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
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
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
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
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}) => (
    <CustomRow
        {...baseLayoutProps}
        title="TR_TX_DEPOSIT"
        sign="negative"
        amount={formatCardanoDeposit(transaction) ?? '0'}
        transaction={transaction}
        useFiatValues={useFiatValues}
    />
);

export const CoinjoinRow = ({
    transaction,
    useFiatValues,
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
}) => {
    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey(transaction.symbol, fiatCurrencyCode);
    const historicRate = useSelector(state =>
        selectHistoricFiatRatesByTimestamp(state, fiatRateKey, transaction.blockTime as Timestamp),
    );

    return (
        <TransactionTargetLayout
            fiatAmount={
                useFiatValues ? (
                    <FiatValue
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
            isFirst
            isLast
        />
    );
};
