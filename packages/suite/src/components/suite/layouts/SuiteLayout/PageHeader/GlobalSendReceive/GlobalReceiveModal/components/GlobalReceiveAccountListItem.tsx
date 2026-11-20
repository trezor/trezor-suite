import { AccountLabel } from '@suite/account';
import { Address } from '@suite/address';
import { type TradingAssetOption, getUnusedAddressFromAccount } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { CardList, Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { ItemClickableContainer } from '#src/components/suite/asset-picker/components/AssetRow/ItemClickableContainer';

import { GlobalReceiveAccountAssetAmount } from './GlobalReceiveAccountAssetAmount';
import { GlobalReceiveAccountTotalAmount } from './GlobalReceiveAccountTotalAmount';

type GlobalReceiveAccountListItemProps = {
    account: Account;
    /** The asset being received; without one the row sums up the whole account. */
    asset?: TradingAssetOption;
    iconSize: 24 | 40;
    onClick: (account: Account) => void;
    variant: 'card' | 'plain';
};

export const GlobalReceiveAccountListItem = ({
    account,
    asset,
    iconSize,
    onClick,
    variant,
}: GlobalReceiveAccountListItemProps) => {
    const { address } = getUnusedAddressFromAccount(account);
    const dataTestId = `@global-receive-account/${account.accountType}/${account.symbol}/${account.index}`;

    const content = (
        <>
            <Row data-testid={dataTestId} gap={12} alignItems="center" overflow="hidden" flex="1">
                <TokenIcon networkSymbol={account.symbol} size={iconSize} />
                <Column overflow="hidden" alignItems="flex-start">
                    <Text typographyStyle="body-md" as="div" maxWidth="100%">
                        <AccountLabel
                            account={account}
                            accountTypeBadgeSize="small"
                            showAccountTypeBadge
                        />
                    </Text>
                    {address !== undefined && (
                        <Address
                            value={address}
                            intent="neutral"
                            priority="secondary"
                            typographyStyle="body-sm"
                            isTruncated
                        />
                    )}
                </Column>
            </Row>
            {asset === undefined ? (
                <GlobalReceiveAccountTotalAmount account={account} />
            ) : (
                <GlobalReceiveAccountAssetAmount account={account} asset={asset} />
            )}
        </>
    );

    if (variant === 'plain') {
        return (
            <ItemClickableContainer onClick={() => onClick(account)}>
                {content}
            </ItemClickableContainer>
        );
    }

    return <CardList.Item onClick={() => onClick(account)}>{content}</CardList.Item>;
};
