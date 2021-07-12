import React from 'react';
import { TooltipConditional } from '@trezor/components';
import styled from 'styled-components';
import { UnavailableCapability } from 'trezor-connect';
import { Network } from '@wallet-types';
import { TrezorDevice, ExtendedMessageDescriptor } from '@suite-types';
import { Coin, Translation } from '@suite-components';
import { getDeviceModel, isBitcoinOnly } from '@suite-utils/device';
import { useDevice } from '@suite-hooks';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-flow: wrap;
`;

interface UnavailableMessageProps {
    whyDisabled?: UnavailableCapability;
    device: TrezorDevice;
}
const unavailabilityReason = ({ whyDisabled, device }: UnavailableMessageProps) => {
    const deviceModel = getDeviceModel(device);
    const isBtcOnly = isBitcoinOnly(device);
    switch (whyDisabled) {
        case 'no-capability':
            return deviceModel === '1' && !isBtcOnly
                ? // right know it serves only one purpose - in case of XRP on T1 inform user that the capability is available on TT
                  'FW_CAPABILITY_SUPPORTED_IN_T2'
                : 'FW_CAPABILITY_NO_CAPABILITY';
        case 'no-support':
            return 'FW_CAPABILITY_NO_SUPPORT';
        case 'update-required':
            return 'FW_CAPABILITY_UPDATE_REQUIRED';
        // case 'trezor-connect-outdated':
        default:
            return 'FW_CAPABILITY_CONNECT_OUTDATED';
    }
};

interface TooltipContentProps {
    tooltip?: ExtendedMessageDescriptor['id'];
    device: TrezorDevice;
    isDisabled: boolean;
    whyDisabled?: UnavailableCapability;
}
const getTooltipContent = ({ tooltip, device, isDisabled, whyDisabled }: TooltipContentProps) => {
    const contentKey = isDisabled ? unavailabilityReason({ device, whyDisabled }) : tooltip;
    return contentKey && <Translation id={contentKey} />;
};

interface Props {
    onToggleFn: (symbol: Network['symbol'], visible: boolean) => void;
    networks: Network[];
    selectedNetworks: Network['symbol'][];
    unavailableCapabilities: TrezorDevice['unavailableCapabilities'];
}

const CoinsList = ({ onToggleFn, networks, selectedNetworks, unavailableCapabilities }: Props) => {
    const { device, isLocked } = useDevice();
    if (!device) return null;

    const isDeviceLocked = isLocked();

    return (
        <Wrapper>
            {networks.map(({ symbol, accountType, label, tooltip, name }) => {
                const isSelected = selectedNetworks.includes(symbol);
                const isDisabled = !!unavailableCapabilities?.[symbol] || isDeviceLocked;
                const tooltipContent = getTooltipContent({
                    tooltip,
                    device,
                    isDisabled,
                    whyDisabled: unavailableCapabilities?.[symbol],
                });

                return (
                    <TooltipConditional
                        key={`${symbol}_${accountType}`}
                        placement="top"
                        content={tooltipContent}
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
