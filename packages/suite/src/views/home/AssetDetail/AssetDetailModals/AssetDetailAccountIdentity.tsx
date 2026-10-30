import { AccountLabel } from '@suite/account';
import { Address } from '@suite/address';
import { getUnusedAddressFromAccount } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

type AssetDetailAccountIdentityProps = {
    account: Account;
    'data-testid'?: string;
};

export const AssetDetailAccountIdentity = ({
    account,
    'data-testid': dataTestId,
}: AssetDetailAccountIdentityProps) => {
    const { address } = getUnusedAddressFromAccount(account);

    return (
        <Row gap={12} alignItems="center" overflow="hidden" flex="1" data-testid={dataTestId}>
            <TokenIcon symbol={account.symbol} size={24} />
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
    );
};
