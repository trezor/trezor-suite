import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountLabel } from 'src/components/suite/AccountLabel';

import { ItemClickableContainer } from '../ItemClickableContainer';

export type AssetRowReceiveToAccountProps = {
    account: Account;
    dataTestId?: string;
    onClick: (account: Account) => void;
};

export function AssetRowReceiveToAccount({
    dataTestId,
    account,
    onClick,
}: AssetRowReceiveToAccountProps) {
    const supportsTokens = useMemo(
        () => getNetworkFeatures(account.symbol).includes('tokens'),
        [account.symbol],
    );

    return (
        <ItemClickableContainer onClick={() => onClick(account)}>
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden">
                <CoinLogo symbol={account.symbol} size={40} type="token" />
                <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
                    <Text typographyStyle="body-md" as="div" maxWidth="100%">
                        <AccountLabel
                            account={account}
                            accountTypeBadgeSize="medium"
                            showAccountTypeBadge={true}
                        />
                    </Text>
                    {supportsTokens && (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_INCLUDING_TOKENS" />
                        </Text>
                    )}
                </Column>
            </Row>
        </ItemClickableContainer>
    );
}
