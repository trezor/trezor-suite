import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import { type FormatterProps } from '../types';
import { CryptoToFiatAmountFormatter } from './CryptoToFiatAmountFormatter';
import { TokenToFiatAmountFormatter } from './TokenToFiatAmountFormatter';

type CoinToFiatAmountFormatterProps = FormatterProps<string | null | number> &
    TextProps & {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        isBalance?: boolean;
        isDiscreetText?: boolean;
        isForcedDiscreetMode?: boolean;
        decimals?: number;
    };

export const CoinToFiatAmountFormatter = ({
    value,
    accountKey,
    tokenContract,
    decimals,
    ...restProps
}: CoinToFiatAmountFormatterProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    if (!symbol) {
        return null;
    }

    if (tokenInfo && value) {
        return (
            <TokenToFiatAmountFormatter
                value={value}
                contract={tokenInfo.contract}
                symbol={symbol}
                decimals={decimals ?? tokenInfo.decimals}
                {...restProps}
            />
        );
    }

    return <CryptoToFiatAmountFormatter value={value} symbol={symbol} {...restProps} />;
};
