import { useMemo } from 'react';

import { getNetworkFeatures } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite/AccountLabel';
import { Translation } from 'src/components/suite/Translation';

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
            <Row data-testid={dataTestId} gap={spacings.sm} alignItems="center" overflow="hidden">
                <CoinLogo symbol={account.symbol} size={40} type="token" />
                <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
                    <AccountLabel
                        account={account}
                        accountTypeBadgeSize="medium"
                        showAccountTypeBadge={true}
                    />
                    {supportsTokens && (
                        <Text typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_INCLUDING_TOKENS" />
                        </Text>
                    )}
                </Column>
            </Row>
        </ItemClickableContainer>
    );
}
