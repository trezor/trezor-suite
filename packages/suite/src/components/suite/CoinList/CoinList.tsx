import styled from 'styled-components';

import { getCoinUnavailabilityMessage } from '@suite-common/suite-utils';
import { Tooltip } from '@trezor/components';
import { getFirmwareVersion, isDeviceInBootloaderMode } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import { Translation } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import type { Network } from 'src/types/wallet';

import { Coin } from './Coin';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-flow: wrap;
    gap: 16px 12px;
`;

interface CoinListProps {
    networks: Network[];
    selectedNetworks?: Network['symbol'][];
    settingsMode?: boolean;
    onSettings?: (symbol: Network['symbol']) => void;
    onToggle: (symbol: Network['symbol'], toggled: boolean) => void;
}

export const CoinList = ({
    networks,
    selectedNetworks,
    settingsMode = false,
    onSettings,
    onToggle,
}: CoinListProps) => {
    const { device, isLocked } = useDevice();
    const blockchain = useSelector(state => state.wallet.blockchain);

    const isDeviceLocked = !!device && isLocked();
    const lockedTooltip = isDeviceLocked && 'TR_DISABLED_SWITCH_TOOLTIP';
    const deviceModelInternal = device?.features?.internal_model;
    const isBootloaderMode = isDeviceInBootloaderMode(device);
    const firmwareVersion = getFirmwareVersion(device);

    const deviceDisplayName = device?.name;

    return (
        <Wrapper>
            {networks.map(network => {
                const { symbol, label, tooltip, name, support } = network;

                const firmwareSupportRestriction =
                    deviceModelInternal && support?.[deviceModelInternal];
                const isSupportedByApp =
                    !firmwareVersion ||
                    !firmwareSupportRestriction ||
                    versionUtils.isNewerOrEqual(firmwareVersion, firmwareSupportRestriction);

                const unavailableReason = isSupportedByApp
                    ? device?.unavailableCapabilities?.[symbol]
                    : 'update-required';

                const isEnabled = !!selectedNetworks?.includes(symbol);

                const disabled =
                    (!settingsMode && !!unavailableReason && !isBootloaderMode) ||
                    isDeviceLocked ||
                    !isSupportedByApp;
                const unavailabilityTooltip =
                    !!unavailableReason &&
                    !isBootloaderMode &&
                    getCoinUnavailabilityMessage(unavailableReason);
                const tooltipString = lockedTooltip || unavailabilityTooltip || tooltip;

                const coinLabel = blockchain[symbol].backends.selected
                    ? 'TR_CUSTOM_BACKEND'
                    : label;

                return (
                    <Tooltip
                        key={symbol}
                        placement="top"
                        content={
                            tooltipString && (
                                <Translation
                                    id={tooltipString}
                                    values={{
                                        deviceDisplayName,
                                    }}
                                />
                            )
                        }
                    >
                        <Coin
                            symbol={symbol}
                            name={name}
                            label={coinLabel}
                            toggled={isEnabled}
                            disabled={disabled || (settingsMode && !isEnabled)}
                            forceHover={settingsMode}
                            onToggle={disabled ? undefined : () => onToggle(symbol, !isEnabled)}
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
