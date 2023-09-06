import { goto } from 'src/actions/suite/routerActions';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { AccountExceptionLayout } from 'src/components/wallet';

/**
 * Handler for invalid wallet setting, no coins in discovery
 * see: @wallet-actions/selectedAccountActions
 */
export const DiscoveryEmpty = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const isDisabled = !device || !device.connected || device.authFailed || device.authConfirm;

    const goToCoinsSettings = () => dispatch(goto('settings-coins'));

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY" />}
            image="CLOUDY"
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
            actions={[
                {
                    key: '1',
                    isLoading: isDeviceLocked,
                    isDisabled,
                    icon: 'SETTINGS',
                    onClick: goToCoinsSettings,
                    children: <Translation id="TR_COIN_SETTINGS" />,
                },
            ]}
        />
    );
};
