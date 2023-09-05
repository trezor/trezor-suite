import BigNumber from 'bignumber.js';
import { FiatValue, Translation } from 'src/components/suite';
import {
    formatCardanoWithdrawal,
    formatCardanoDeposit,
    formatNetworkAmount,
} from '@suite-common/wallet-utils';
import { WalletAccountTransaction } from 'src/types/wallet';
import { BaseTargetLayout } from './BaseTargetLayout';
import { ExtendedMessageDescriptor } from 'src/types/suite';
import { SignOperator } from '@suite-common/suite-types';
import { StyledFormattedCryptoAmount } from './CommonComponents';

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
}) => (
    <BaseTargetLayout
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
                    source={transaction.rates}
                    useCustomSource
                />
            ) : undefined
        }
    />
);

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
}) => (
    <BaseTargetLayout
        fiatAmount={
            useFiatValues ? (
                <FiatValue
                    amount={formatNetworkAmount(
                        new BigNumber(transaction.amount).abs().toString(),
                        transaction.symbol,
                    )}
                    symbol={transaction.symbol}
                    source={transaction.rates}
                    useCustomSource
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
