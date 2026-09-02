import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { type Network } from '@suite-common/wallet-config';
import { changeCoinVisibilityThunk } from '@suite-common/wallet-core';
import { PlusIcon, WarningIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';

interface AccountNotEnabledProps {
    network: Network;
}

/**
 * Handler for invalid router params, coin is not enabled in settings
 * see: @wallet-actions/selectedAccountActions
 */
export const AccountNotEnabled = ({ network }: AccountNotEnabledProps) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const handleClick = () =>
        dispatch(changeCoinVisibilityThunk({ symbol: network.symbol, shouldBeVisible: true }));

    return (
        <AccountExceptionLayout
            title={
                <Translation
                    id="TR_ACCOUNT_EXCEPTION_NOT_ENABLED"
                    values={{ networkName: network.name }}
                />
            }
            icon={WarningIcon}
            iconVariant="warning"
            actions={[
                {
                    iconLeft: PlusIcon,
                    key: '1',
                    isLoading: isLocked(),
                    onClick: handleClick,
                    children: (
                        <Translation
                            id="TR_ENABLE_NETWORK_BUTTON"
                            values={{ networkName: network.name }}
                        />
                    ),
                },
            ]}
        />
    );
};
