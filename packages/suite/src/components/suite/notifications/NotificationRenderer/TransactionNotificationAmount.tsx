import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isNftTokenTransfer } from '@suite-common/wallet-utils';
import { Row } from '@trezor/components';
import { type TokenInfo, type TokenTransfer } from '@trezor/connect';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { TokenUrlBlur } from 'src/components/suite/TokenUrlBlur';

export type TransactionNotificationAmountProps = {
    amount: string;
    symbol: NetworkSymbol;
    token?: Pick<TokenInfo, 'contract' | 'symbol' | 'decimals'> & Pick<TokenTransfer, 'standard'>;
    isSymbolRenderedBesideAmount: boolean;
};

export const TransactionNotificationAmount = ({
    amount,
    symbol,
    token,
    isSymbolRenderedBesideAmount,
}: TransactionNotificationAmountProps) => {
    // The amount of an NFT notification is its token ID.
    if (token !== undefined && isNftTokenTransfer(token)) {
        return (
            <Row display="inline-flex" gap={4} alignItems="baseline">
                <Translation id="TR_TOKEN_ID_COLON" />
                <span>{amount}</span>
                {!!token.symbol && <TokenUrlBlur text={token.symbol} />}
            </Row>
        );
    }

    return (
        <FormattedCryptoAmount
            value={amount}
            symbol={isSymbolRenderedBesideAmount ? undefined : (token?.symbol ?? symbol)}
            contractAddress={token?.contract}
            tokenDecimals={token?.decimals}
            isCompact
            disableHiddenPlaceholder
        />
    );
};
