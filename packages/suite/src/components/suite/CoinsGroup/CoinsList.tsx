import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
import { versionUtils } from '@trezor/utils';
import { Coin, Translation } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { getCoinUnavailabilityMessage } from 'src/utils/suite/device';
import type { Network } from 'src/types/wallet';
import {
    getDeviceModel,
    getDeviceDisplayName,
    getFirmwareVersion,
    isDeviceInBootloaderMode,
} from '@trezor/device-utils';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-flow: wrap;
`;

interface CoinsListProps {
    networks: Network[];
    selectedNetworks?: Network['symbol'][];
    settingsMode?: boolean;
    onSettings?: (symbol: Network['symbol']) => void;
    onToggle: (symbol: Network['symbol'], toggled: boolean) => void;
}

const CoinsList = ({
    networks,
    selectedNetworks,
    settingsMode = false,
    onSettings,
    onToggle,
}: CoinsListProps) => {
    const blockchain = useSelector(state => state.wallet.blockchain);

    const { device, isLocked } = useDevice();
    const locked = !!device && isLocked();
    const deviceModel = getDeviceModel(device);

    return (
        <Wrapper>
            {networks.map(({ symbol, label, tooltip, name, support }) => {
                const toggled = !!selectedNetworks?.includes(symbol);
                const isBootloaderMode = isDeviceInBootloaderMode(device);

                const lockedTooltip = locked && 'TR_DISABLED_SWITCH_TOOLTIP';

                const backend = blockchain[symbol].backends.selected;
                const note = backend ? 'TR_CUSTOM_BACKEND' : label;

                const firmwareVersion = getFirmwareVersion(device);

                const supportField = deviceModel && support?.[deviceModel];
                const supportedBySuite =
                    !firmwareVersion ||
                    !supportField ||
                    versionUtils.isNewerOrEqual(firmwareVersion, supportField);

                let unavailable = device?.unavailableCapabilities?.[symbol];
                if (!supportedBySuite) {
                    unavailable = 'update-required';
                }

                // Coin is not available because:
                // - connect reports this in device.unavailableCapabilities (not supported by fw, not supported by connect)
                // - suite considers device 'locked'
                // - suite does not support it which is defined in network.ts
                // When in bootloader mode we cannot check version of firmware so we do not know if coin is available.
                // In order to achieve consistency between devices we do not use it when in bootloader mode.
                const disabled =
                    (!settingsMode && !!unavailable && !isBootloaderMode) ||
                    locked ||
                    !supportedBySuite;
                const unavailabilityTooltip =
                    !!unavailable && !isBootloaderMode && getCoinUnavailabilityMessage(unavailable);
                const tooltipString = lockedTooltip || unavailabilityTooltip || tooltip;

                return (
                    <Tooltip
                        key={symbol}
                        placement="top"
                        content={
                            tooltipString && (
                                <Translation
                                    id={tooltipString}
                                    values={{
                                        deviceDisplayName: getDeviceDisplayName(deviceModel),
                                    }}
                                />
                            )
                        }
                    >
                        <Coin
                            symbol={symbol}
                            name={name}
                            label={note}
                            toggled={toggled}
                            disabled={disabled || (settingsMode && !toggled)}
                            forceHover={settingsMode}
                            onToggle={disabled ? undefined : () => onToggle(symbol, !toggled)}
                            onSettings={
                                disabled || !onSettings ? undefined : () => onSettings(symbol)
                            }
                        />
                    </Tooltip>
                );
            })}
        </Wrapper>
    );
};

export default CoinsList;
