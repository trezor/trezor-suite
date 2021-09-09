import React from 'react';
import { TooltipConditional } from '@trezor/components';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { Coin, Translation } from '@suite-components';
import { getUnavailabilityMessage } from '@suite-utils/device';
import { useDevice } from '@suite-hooks';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-flow: wrap;
`;

interface Props {
    onToggleFn: (symbol: Network['symbol'], visible: boolean) => void;
    networks: Network[];
    selectedNetworks: Network['symbol'][];
}

const CoinsList = ({ onToggleFn, networks, selectedNetworks }: Props) => {
    const { device, isLocked } = useDevice();
    if (!device) return null;

    const isDeviceLocked = isLocked();

    return (
        <Wrapper>
            {networks.map(({ symbol, accountType, label, tooltip, name }) => {
                const isSelected = selectedNetworks.includes(symbol);
                const unavailableCapability = device.unavailableCapabilities?.[symbol];
                const isDisabled = !!unavailableCapability || isDeviceLocked;
                const tooltipContent = unavailableCapability && (
                    <Translation
                        id={getUnavailabilityMessage(
                            unavailableCapability,
                            device.features?.major_version,
                        )}
                    />
                );

                return (
                    <TooltipConditional
                        key={`${symbol}_${accountType}`}
                        placement="top"
                        content={tooltipContent || tooltip}
                    >
                        <Coin
                            symbol={symbol}
                            name={name}
                            label={label}
                            selected={isSelected}
                            disabled={isDisabled}
                            onClick={
                                isDisabled
                                    ? undefined
                                    : () => {
                                          onToggleFn(symbol, !isSelected);
                                      }
                            }
                        />
                    </TooltipConditional>
                );
            })}
        </Wrapper>
    );
};

export default CoinsList;
