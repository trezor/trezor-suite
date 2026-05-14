import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type TextProps } from '@suite-native/atoms';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

import { TokenAmountFormatter } from './TokenAmountFormatter';
import { type FormatterProps } from '../types';
import { CryptoAmountFormatter } from './CryptoAmountFormatter';

type CoinAmountFormatterProps = FormatterProps<string | null | number> &
    TextProps & {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        isBalance?: boolean;
        isDiscreetText?: boolean;
        isForcedDiscreetMode?: boolean;
        decimals?: number;
    };

export const CoinAmountFormatter = ({
    value,
    accountKey,
    tokenContract,
    decimals,
    ...restProps
}: CoinAmountFormatterProps) => {
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
            <TokenAmountFormatter
                decimals={decimals ?? tokenInfo.decimals}
                value={value}
                tokenSymbol={tokenInfo.symbol}
                {...restProps}
            />
        );
    }

    return <CryptoAmountFormatter value={value} symbol={symbol} {...restProps} />;
};
