import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { selectAccountTokenInfo, TokensRootState } from '@suite-native/tokens';
import { TextProps } from '@suite-native/atoms';

import { FormatterProps } from '../types';
import { TokenToFiatAmountFormatter } from './TokenToFiatAmountFormatter';
import { CryptoToFiatAmountFormatter } from './CryptoToFiatAmountFormatter';

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
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    if (!networkSymbol) {
        return null;
    }

    if (tokenInfo && value) {
        return (
            <TokenToFiatAmountFormatter
                value={value}
                contract={tokenInfo.contract}
                networkSymbol={networkSymbol}
                decimals={decimals ?? tokenInfo.decimals}
                {...restProps}
            />
        );
    }

    return <CryptoToFiatAmountFormatter value={value} network={networkSymbol} {...restProps} />;
};
