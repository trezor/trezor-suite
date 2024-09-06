import { Badge, BadgeSize } from '@trezor/components';
import { Translation } from './Translation';
import { getAccountTypeName } from '@suite-common/wallet-utils';
import { AccountType, Bip43Path, NetworkType } from '@suite-common/wallet-config';

type AccountTypeBadgeProps = {
    accountType?: AccountType;
    path?: Bip43Path;
    networkType?: NetworkType;
    onElevation?: boolean;
    size?: BadgeSize;
    shouldDisplayNormalType?: boolean;
};

export const AccountTypeBadge = ({
    accountType,
    path,
    networkType,
    size = 'medium',
    onElevation = false,
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
        <Badge size={size} onElevation={onElevation}>
            {accountTypeName ? <Translation id={accountTypeName} /> : null}
        </Badge>
    );
};
