import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Row, Text } from '@trezor/components';

import { CoinBalance } from 'src/components/suite';

import { AccountItemBadge } from './AccountItemBadge';
import { AccountStakingBadge } from './AccountStakingBadge';
import { BalancePlaceholder } from './BalancePlaceholder';

type AccountItemBottomLineProps = {
    account: Account;
    tokenCount: number;
    hasStaking: boolean;
    shouldShowCryptoBalance: boolean;
    shouldShowBalancePlaceholder: boolean;
};

export const AccountItemBottomLine = ({
    account,
    tokenCount,
    hasStaking,
    shouldShowCryptoBalance,
    shouldShowBalancePlaceholder,
}: AccountItemBottomLineProps) => {
    if (
        !hasStaking &&
        tokenCount === 0 &&
        !shouldShowCryptoBalance &&
        !shouldShowBalancePlaceholder
    ) {
        return null;
    }

    return (
        <Row gap={4} justifyContent="flex-end" width="100%">
            {hasStaking && <AccountStakingBadge account={account} />}
            {tokenCount > 0 && (
                <AccountItemBadge>
                    <Translation id="TR_ACCOUNT_TOKENS_COUNT" values={{ count: tokenCount }} />
                </AccountItemBadge>
            )}
            {shouldShowCryptoBalance && (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <CoinBalance
                        data-testid="@wallet"
                        value={account.formattedBalance}
                        symbol={account.symbol}
                        showApproximation
                    />
                </Text>
            )}
            {shouldShowBalancePlaceholder && <BalancePlaceholder />}
        </Row>
    );
};
