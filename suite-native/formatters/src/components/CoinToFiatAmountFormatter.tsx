import { useSelector } from 'react-redux';

import { type TokenAddress } from '@suite-common/tokens';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';

import { type DiscreetMode, type FormatterProps } from '../types';
import { CryptoToFiatAmountFormatter } from './CryptoToFiatAmountFormatter';
import { TokenToFiatAmountFormatter } from './TokenToFiatAmountFormatter';

type CoinToFiatAmountFormatterProps = FormatterProps<string | null | number> &
    TextProps & {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        isBalance?: boolean;
        discreetMode?: DiscreetMode;
    };

export const CoinToFiatAmountFormatter = ({
    value,
    accountKey,
    tokenContract,
    ...restProps
}: CoinToFiatAmountFormatterProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!symbol) {
        return null;
    }

    if (tokenContract && value) {
        return (
            <TokenToFiatAmountFormatter
                value={value}
                contract={tokenContract}
                symbol={symbol}
                {...restProps}
            />
        );
    }

    return <CryptoToFiatAmountFormatter value={value} symbol={symbol} {...restProps} />;
};
