import { CompactCryptoAmountFormatter } from '@suite-native/formatters';

import {
    WrappedNativeAmountInputCard,
    type WrappedNativeAmountInputCardProps,
} from './WrappedNativeAmountInputCard';

type NativeCoinAmountInputCardProps = Omit<
    WrappedNativeAmountInputCardProps,
    'balanceValue' | 'tokenContract'
>;

export const NativeCoinAmountInputCard = ({
    balance,
    symbol,
    ...props
}: NativeCoinAmountInputCardProps) => (
    <WrappedNativeAmountInputCard
        {...props}
        balance={balance}
        symbol={symbol}
        balanceValue={
            <CompactCryptoAmountFormatter
                symbol={symbol}
                value={balance}
                variant="body-sm"
                color="contentSecondary"
            />
        }
    />
);
