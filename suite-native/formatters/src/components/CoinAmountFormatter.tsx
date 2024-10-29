import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { selectAccountTokenInfo, selectAccountTokenSymbol } from '@suite-native/tokens';
import { TextProps } from '@suite-native/atoms';

import { TokenAmountFormatter } from './TokenAmountFormatter';
import { FormatterProps } from '../types';
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
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const tokenInfo = useSelector((state: AccountsRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    if (!networkSymbol) {
        return null;
    }

    if (tokenInfo && value) {
        return (
            <TokenAmountFormatter
                decimals={decimals ?? tokenInfo.decimals}
                value={value}
                symbol={tokenSymbol}
                {...restProps}
            />
        );
    }

    return <CryptoAmountFormatter value={value} network={networkSymbol} {...restProps} />;
};
