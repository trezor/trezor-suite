import { Translation } from '@suite/intl';
import { type AccountType, type Bip43Path, type NetworkType } from '@suite-common/wallet-config';
import { getAccountTypeName } from '@suite-common/wallet-utils';
import { Badge, type BadgeSize } from '@trezor/components';

type AccountTypeBadgeProps = {
    accountType?: AccountType;
    path?: Bip43Path;
    networkType?: NetworkType;
    size?: BadgeSize;
    shouldDisplayNormalType?: boolean;
};

export const AccountTypeBadge = ({
    accountType,
    path,
    networkType,
    size = 'medium',
    shouldDisplayNormalType = false,
}: AccountTypeBadgeProps) => {
    if (!accountType || !networkType) {
        return null;
    }

    if (!shouldDisplayNormalType && accountType === 'normal') {
        return null;
    }

    const accountTypeName = getAccountTypeName({ path, accountType, networkType });

    return (
        <Badge size={size}>{accountTypeName ? <Translation id={accountTypeName} /> : null}</Badge>
    );
};
