import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite/AccountLabel';

import { AssetImage } from '../AssetImage';
import { ItemClickableContainer } from '../ItemClickableContainer';
import { AccountAmount } from './AccountAmount';

export const ASSET_ROW_ACCOUNT_HEIGHT = 68;

export type AssetRowAccountProps = {
    account: Account;
    'data-testid'?: string;
    onClick: (account: Account) => void;

    variant: 'receive-to-account' | 'send-from-account';
};

export function AssetRowAccount({
    'data-testid': dataTestId,
    account,
    onClick,
    variant,
}: AssetRowAccountProps) {
    return (
        <ItemClickableContainer onClick={() => onClick(account)}>
            {variant === 'receive-to-account' && (
                <Row data-testid={dataTestId} gap={spacings.sm} alignItems="center">
                    <AssetImage
                        size={40}
                        symbol={account.symbol}
                        networkSymbol={account.symbol}
                        networkType={account.networkType}
                    />
                    <Text variant="default" typographyStyle="body">
                        <AccountLabel
                            account={account}
                            accountTypeBadgeSize="medium"
                            showAccountTypeBadge={true}
                        />
                    </Text>
                </Row>
            )}

            {variant === 'send-from-account' && (
                <Row data-testid={dataTestId} gap={spacings.sm} alignItems="center">
                    <AssetImage
                        size={40}
                        symbol={account.symbol}
                        networkSymbol={account.symbol}
                        networkType={account.networkType}
                    />

                    <Column alignItems="flex-start" justifyContent="flex-start">
                        <Text variant="default" typographyStyle="body">
                            {getNetwork(account.symbol).name}
                        </Text>
                        <Text variant="tertiary" typographyStyle="hint">
                            {getDisplaySymbol(account.symbol)}
                        </Text>
                    </Column>
                </Row>
            )}

            <AccountAmount account={account} />
        </ItemClickableContainer>
    );
}
