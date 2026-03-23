import { Translation } from '@suite/intl';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { CardList, Column, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { AccountLabel } from 'src/components/suite/AccountLabel';

type GlobalReceiveAccountListItemProps = {
    account: Account;
    dataTestId: string;
    onClick: (account: Account) => void;
};

export const GlobalReceiveAccountListItem = ({
    account,
    dataTestId,
    onClick,
}: GlobalReceiveAccountListItemProps) => {
    const supportsTokens = getNetworkFeatures(account.symbol).includes('tokens');

    return (
        <CardList.Item onClick={() => onClick(account)}>
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden">
                <CoinLogo symbol={account.symbol} size={40} type="token" />
                <Column overflow="hidden" alignItems="flex-start" justifyContent="flex-start">
                    <Text typographyStyle="body-md" as="div" maxWidth="100%">
                        <AccountLabel
                            account={account}
                            accountTypeBadgeSize="medium"
                            showAccountTypeBadge
                        />
                    </Text>
                    {supportsTokens && (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_INCLUDING_TOKENS" />
                        </Text>
                    )}
                </Column>
            </Row>
        </CardList.Item>
    );
};
