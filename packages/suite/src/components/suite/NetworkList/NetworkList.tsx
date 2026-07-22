import { type ReactNode } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { getCoinUnavailabilityMessage } from '@suite-common/suite-utils';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBlockchainState } from '@suite-common/wallet-core';
import { Column, Tooltip } from '@trezor/components';
import { getFirmwareVersion, isDeviceInBootloaderMode } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import { useDiscovery, useSelector } from 'src/hooks/suite';

import { NetworkCard } from './NetworkCard';
import { getBackendStatus } from './getBackendStatus';

export type NetworkListProps = {
    networks: Network[];
    enabledNetworks?: NetworkSymbol[];
    isCardClickable?: boolean;
    onClick?: (symbol: NetworkSymbol, isEnabled: boolean) => void;
    onSettings?: (symbol: NetworkSymbol) => void;
    renderRightContent?: (params: {
        network: Network;
        isEnabled: boolean;
        onClick: () => void;
    }) => ReactNode;
    /**
     * When `true`, toggles stay enabled regardless of device/UI lock state and the
     * "Loading accounts" tooltip is not shown. Intended for callers that only stage
     * changes locally and apply them explicitly.
     */
    ignoreDeviceLock?: boolean;
};

export const NetworkList = ({
    networks,
    enabledNetworks,
    isCardClickable = true,
    onClick,
    onSettings,
    renderRightContent,
    ignoreDeviceLock = false,
}: NetworkListProps) => {
    const { device, isLocked } = useDevice();
    const blockchain = useSelector(selectBlockchainState);
    const isDeviceLocked = !ignoreDeviceLock && !!device && isLocked(true);
    const { isDiscoveryRunning } = useDiscovery();
    const lockedTooltip = isDeviceLocked ? 'TR_DISABLED_SWITCH_TOOLTIP' : null;
    const discoveryTooltip = !ignoreDeviceLock && isDiscoveryRunning ? 'TR_LOADING_ACCOUNTS' : null;

    const deviceModelInternal = device?.features?.internal_model;
    const isBootloaderMode = isDeviceInBootloaderMode(device);
    const firmwareVersion = getFirmwareVersion(device);

    const deviceDisplayName = device?.name;

    return (
        <Column gap={12} width="100%">
            {networks.map(network => {
                const { symbol, name, support } = network;
                const blockchainInfo = blockchain[symbol];
                const hasCustomBackend = !!blockchainInfo.backends.selected;
                const backendStatus = getBackendStatus(blockchainInfo);

                const firmwareSupportRestriction =
                    deviceModelInternal && support?.[deviceModelInternal];
                const isSupportedByApp =
                    !firmwareVersion ||
                    !firmwareSupportRestriction ||
                    versionUtils.isNewerOrEqual(firmwareVersion, firmwareSupportRestriction);

                const unavailableReason = isSupportedByApp
                    ? device?.unavailableCapabilities?.[symbol]
                    : 'update-required';

                const isEnabled = !!enabledNetworks?.includes(symbol);

                const isDisabled = isDeviceLocked;
                const unavailabilityTooltip =
                    !!unavailableReason &&
                    !isBootloaderMode &&
                    getCoinUnavailabilityMessage(unavailableReason);
                const tooltipString = discoveryTooltip || lockedTooltip || unavailabilityTooltip;

                return (
                    <Tooltip
                        key={symbol}
                        placement="top"
                        isActive={!!tooltipString}
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
                        <NetworkCard
                            symbol={symbol}
                            name={name}
                            backendStatus={hasCustomBackend ? backendStatus : undefined}
                            isDisabled={isDisabled}
                            isEnabled={isEnabled}
                            isCardClickable={isCardClickable}
                            onClick={onClick}
                            onSettings={onSettings}
                            rightContent={renderRightContent?.({
                                network,
                                isEnabled,
                                onClick: () => onClick?.(symbol, !isEnabled),
                            })}
                        />
                    </Tooltip>
                );
            })}
        </Column>
    );
};
