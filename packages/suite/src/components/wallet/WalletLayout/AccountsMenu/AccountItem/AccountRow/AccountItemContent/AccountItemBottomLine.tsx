import { Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';

import { CoinBalance } from 'src/components/suite';

import { BalancePlaceholder } from './BalancePlaceholder';

type AccountItemBottomLineProps = {
    account: Account;
    formattedBalance: string;
    shouldShowCryptoBalance: boolean;
    shouldShowBalancePlaceholder: boolean;
};

export const AccountItemBottomLine = ({
    account,
    formattedBalance,
    shouldShowCryptoBalance,
    shouldShowBalancePlaceholder,
}: AccountItemBottomLineProps) => {
    if (!shouldShowCryptoBalance && !shouldShowBalancePlaceholder) return null;

    return (
        <>
            {shouldShowCryptoBalance && (
                <Text typographyStyle="hint" variant="tertiary">
                    <CoinBalance
                        data-testid="@wallet"
                        value={formattedBalance}
                        symbol={account.symbol}
                        showApproximation
                    />
                </Text>
            )}

            {shouldShowBalancePlaceholder && <BalancePlaceholder networkSymbol={account.symbol} />}
        </>
    );
};
