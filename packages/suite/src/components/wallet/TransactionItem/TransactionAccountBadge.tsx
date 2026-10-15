import { AccountLabel } from '@suite/account';
import { type Account } from '@suite-common/wallet-types';
import { Badge, Icon, Row } from '@trezor/components';
import { FolderIcon } from '@trezor/icons';

type TransactionAccountBadgeProps = {
    account: Account;
};

export const TransactionAccountBadge = ({ account }: TransactionAccountBadgeProps) => (
    <Badge size="small" data-testid="@transaction-item/account">
        <Row gap={4}>
            <Icon as={FolderIcon} size={12} />
            <AccountLabel account={account} typographyStyle="body-xs" />
        </Row>
    </Badge>
);
