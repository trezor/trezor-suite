import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
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
            {networks.map(({ symbol, label, tooltip, name }) => {
                const toggled = !!selectedNetworks?.includes(symbol);
                const unavailable = device?.unavailableCapabilities?.[symbol];

                const lockedTooltip = locked && 'TR_DISABLED_SWITCH_TOOLTIP';
                const unavailabilityTooltip =
                    unavailable &&
                    getUnavailabilityMessage(unavailable, device.features?.major_version);
                const anyTooltip = lockedTooltip || unavailabilityTooltip || tooltip;

                const backend = backends[symbol];
                const note = backend ? 'TR_CUSTOM_BACKEND' : label;
                const disabled = !!unavailable || locked;

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
