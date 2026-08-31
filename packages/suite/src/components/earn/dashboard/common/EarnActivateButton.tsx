import { useDispatch } from 'react-redux';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    selectEnabledNetworks,
    selectHasRunningDiscovery,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Button, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
type EarnActivateButtonProps = {
    symbol: NetworkSymbol;
};

export const EarnActivateButton = ({ symbol }: EarnActivateButtonProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const isNetworkEnabled = enabledNetworks.includes(symbol);
    const isDiscoveringThisNetwork = isDiscoveryRunning && isNetworkEnabled;
    const { name } = getNetwork(symbol);

    const isDeviceDisconnected = !device?.connected;
    const isButtonDisabled = isDeviceDisconnected || isDiscoveryRunning;
    const tooltipMessage = isDeviceDisconnected ? (
        <Translation id="TR_TO_ADD_NEW_ACCOUNT_PLEASE_CONNECT" />
    ) : undefined;

    const handleActivate = () => {
        if (!device) {
            return;
        }

        if (isNetworkEnabled) {
            dispatch(startOrRestartDiscoveryThunk());

            return;
        }

        dispatch(
            openModal({
                type: 'add-account',
                device,
                symbol,
                isCoinjoinDisabled: true,
                isBackClickDisabled: true,
            }),
        );
    };

    return (
        <Tooltip
            isActive={!!tooltipMessage}
            tooltipMaxWidth={200}
            content={tooltipMessage}
            placement="top"
            cursor="not-allowed"
            delayShow={TOOLTIP_DELAY_NORMAL}
        >
            <Button
                size="small"
                onClick={handleActivate}
                isDisabled={isButtonDisabled}
                isLoading={isDiscoveringThisNetwork}
            >
                <Translation
                    id="TR_EARN_STAKING_DASHBOARD_ACTIVATE"
                    values={{ networkName: name }}
                />
            </Button>
        </Tooltip>
    );
};
