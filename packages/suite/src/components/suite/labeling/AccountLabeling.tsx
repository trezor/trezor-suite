import { AccountLabel } from '@suite/account';
import { selectDevices, selectSelectedDevice } from '@suite-common/device';
import { isSelectedDevice } from '@suite-common/suite-utils';
import { findAccountDevice } from '@suite-common/wallet-utils';
import { type BadgeProps, type FlexProps } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { type Account as WalletAccount } from 'src/types/wallet';

import { WalletLabeling } from './WalletLabeling';

interface AccountProps {
    account: WalletAccount | WalletAccount[];
    accountTypeBadgeSize?: BadgeProps['size'];
    showAccountTypeBadge?: boolean;
    accountLabelRowProps?: Omit<FlexProps, 'children'>;
    typographyStyle?: TypographyStyle;
}

export const AccountLabeling = ({
    account,
    accountTypeBadgeSize,
    showAccountTypeBadge,
    accountLabelRowProps,
    typographyStyle,
}: AccountProps) => {
    const device = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);

    const accounts = !Array.isArray(account) ? [account] : account;

    if (accounts.length < 1) return null;

    const firstAccount = accounts[0];

    if (!firstAccount) return null;

    const accountLabel = (
        <AccountLabel
            account={firstAccount}
            showAccountTypeBadge={showAccountTypeBadge}
            accountTypeBadgeSize={accountTypeBadgeSize}
            rowProps={accountLabelRowProps}
            typographyStyle={typographyStyle}
        />
    );

    if (device && !accounts.some(a => a.deviceState === device.state?.staticSessionId)) {
        // account is not associated with selected device, add wallet label
        const accountDevice = findAccountDevice(firstAccount, devices);
        if (accountDevice) {
            return (
                <span>
                    <WalletLabeling
                        device={accountDevice}
                        shouldUseDeviceLabel={!isSelectedDevice(device, accountDevice)}
                    />
                    {accountLabel}
                </span>
            );
        }
    }

    return accountLabel;
};
