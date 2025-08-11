import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenIconSet } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import { TokensWithRates, sortTokensWithRates } from 'src/utils/wallet/tokenUtils';

type TokenIconSetWrapperProps = {
    expanded?: boolean;
    symbol: NetworkSymbol;
    tokens?: TokensWithRates[];
    onClick?: () => void;
};

export const TokenIconSetWrapper = ({ symbol, tokens, onClick }: TokenIconSetWrapperProps) => {
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!onClick) return;
        event.stopPropagation();
        onClick();
    };

    const aggregatedTokens = Object.values(
        tokens?.reduce((acc: Record<string, TokensWithRates>, token) => {
            const { contract, balance } = token;

            if (!acc[contract]) {
                acc[contract] = {
                    ...token,
                    balance: balance ?? '0',
                    fiatValue: token.fiatValue ?? new BigNumber(0),
                };
            } else {
                const existingBalance = parseFloat(acc[contract].balance ?? '0');
                const newBalance = existingBalance + parseFloat(balance ?? '0');
                acc[contract].balance = newBalance.toString();

                acc[contract].fiatValue = acc[contract].fiatValue.plus(
                    new BigNumber(token.balance || 0).multipliedBy(token.fiatRate?.rate || 0),
                );
            }

            return acc;
        }, {}) ?? {},
    );

    const sortedAggregatedTokens = aggregatedTokens.sort(sortTokensWithRates);

    return (
        <TokenIconSet
            symbol={symbol}
            tokens={sortedAggregatedTokens.slice(0, 2)}
            onClick={handleClick}
        />
    );
};
