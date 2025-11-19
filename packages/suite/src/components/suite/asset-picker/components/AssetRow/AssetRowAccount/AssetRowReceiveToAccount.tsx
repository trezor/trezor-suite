import { Account } from '@suite-common/wallet-types';
import { Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite/AccountLabel';

import { ItemClickableContainer } from '../ItemClickableContainer';
import { AccountAmount } from './AccountAmount';

export type AssetRowReceiveToAccountProps = {
    account: Account;
    'data-testid'?: string;
    onClick: (account: Account) => void;
};

export function AssetRowReceiveToAccount({
    'data-testid': dataTestId,
    account,
    onClick,
}: AssetRowReceiveToAccountProps) {
    return (
        <ItemClickableContainer onClick={() => onClick(account)}>
            <Row data-testid={dataTestId} gap={spacings.sm} alignItems="center">
                <CoinLogo symbol={account.symbol} size={40} type="token" />

                <Text variant="default" typographyStyle="body">
                    <AccountLabel
                        account={account}
                        accountTypeBadgeSize="medium"
                        showAccountTypeBadge={true}
                    />
                </Text>
            </Row>

            <AccountAmount account={account} />
        </ItemClickableContainer>
    );
}
