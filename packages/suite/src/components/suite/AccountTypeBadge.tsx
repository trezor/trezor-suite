import { UppercaseAccountType } from '@suite-common/wallet-types';
import { AccountType } from '@suite-common/wallet-config';
import { toUppercaseType } from '@suite-common/suite-utils';
import { Badge, BadgeSize } from '@trezor/components';
import { Translation } from './Translation';

type AccountTypeBadgeProps = {
    accountType?: AccountType;
    size?: BadgeSize;
};

export const AccountTypeBadge = ({ accountType, size = 'medium' }: AccountTypeBadgeProps) => {
    if (!accountType || accountType === 'normal') {
        return null;
    }

    const accountTypeUppercase: UppercaseAccountType = toUppercaseType(accountType);

    return (
        <Badge size={size}>
            <Translation id={`TR_ACCOUNT_TYPE_${accountTypeUppercase}`} />
        </Badge>
    );
};
