import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
import { versionUtils } from '@trezor/utils';
import { Coin, Translation } from '@suite-components';
import { useDevice, useSelector } from '@suite-hooks';
import { getUnavailabilityMessage } from '@suite-utils/device';
import type { Network } from '@wallet-types';

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
    const { backends } = useSelector(state => ({
        backends: state.wallet.settings.backends,
    }));

    const { device, isLocked } = useDevice();
    const locked = !!device && isLocked();

    return (
        <Wrapper>
            {networks.map(({ symbol, label, tooltip, name, support }) => {
                const toggled = !!selectedNetworks?.includes(symbol);
                let unavailable = device?.unavailableCapabilities?.[symbol];

                const lockedTooltip = locked && 'TR_DISABLED_SWITCH_TOOLTIP';

                const backend = backends[symbol];
                const note = backend ? 'TR_CUSTOM_BACKEND' : label;

                const features = device?.features;
                const supportField = features && support && support[features.major_version];
                const supportedBySuite =
                    !supportField ||
                    versionUtils.isNewerOrEqual(
                        [features.major_version, features.minor_version, features.patch_version],
                        supportField,
                    );

                if (!supportedBySuite) {
                    unavailable = 'update-required';
                }
                const unavailabilityTooltip =
                    unavailable && getUnavailabilityMessage(unavailable, features?.major_version);
                const anyTooltip = lockedTooltip || unavailabilityTooltip || tooltip;

                // Coin is not available because:
                // - connect reports this in device.unavailableCapabilities (not supported by fw, not supported by connect)
                // - suite considers device 'locked'
                // - suite does not support it which is defined in network.ts
                const disabled = !!unavailable || locked || !supportedBySuite;

                return (
                    <Tooltip
                        key={symbol}
                        placement="top"
                        content={anyTooltip && <Translation id={anyTooltip} />}
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
