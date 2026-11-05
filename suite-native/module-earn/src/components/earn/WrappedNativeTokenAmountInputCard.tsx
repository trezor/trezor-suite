import { type TokenAddress } from '@suite-common/wallet-types';
import { CompactTokenAmountFormatter, asDecimalTokenAmount } from '@suite-native/formatters';

import {
    WrappedNativeAmountInputCard,
    type WrappedNativeAmountInputCardProps,
} from './WrappedNativeAmountInputCard';

type WrappedNativeTokenAmountInputCardProps = Omit<
    WrappedNativeAmountInputCardProps,
    'balanceValue' | 'tokenContract'
> & {
    tokenContract: TokenAddress;
};

export const WrappedNativeTokenAmountInputCard = ({
    balance,
    symbol,
    tokenContract,
    ...props
}: WrappedNativeTokenAmountInputCardProps) => (
    <WrappedNativeAmountInputCard
        {...props}
        balance={balance}
        symbol={symbol}
        tokenContract={tokenContract}
        balanceValue={
            <CompactTokenAmountFormatter
                networkSymbol={symbol}
                contractAddress={tokenContract}
                value={asDecimalTokenAmount(balance)}
                variant="body-sm"
                color="contentSecondary"
            />
        }
    />
);
