import React from 'react';
import { Tooltip } from '@trezor/components';
import styled from 'styled-components';
import { UnavailableCapability } from 'trezor-connect';
import { Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';
import { Coin, Translation } from '@suite-components';
import { isBitcoinOnly } from '@suite-utils/device';
import { useDevice } from '@suite-hooks';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-flow: wrap;
`;

interface UnavailableMessageProps {
    type?: UnavailableCapability;
    deviceVersion: number;
    isBtcOnly: boolean;
}
const UnavailableMessage = ({ type, deviceVersion, isBtcOnly }: UnavailableMessageProps) => {
    switch (type) {
        case 'no-capability':
            return deviceVersion === 1 && !isBtcOnly ? (
                // right know it serves only one purpose - in case of XRP on T1 inform user that the capability is available on TT
                <Translation id="FW_CAPABILITY_SUPPORTED_IN_T2" />
            ) : (
                <Translation id="FW_CAPABILITY_NO_CAPABILITY" />
            );
        case 'no-support':
            return <Translation id="FW_CAPABILITY_NO_SUPPORT" />;
        case 'update-required':
            return <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />;
        // case 'trezor-connect-outdated':
        default:
            return <Translation id="FW_CAPABILITY_CONNECT_OUTDATED" />;
    }
};

interface Props {
    onToggleFn: (symbol: Network['symbol'], visible: boolean) => void;
    networks: Network[];
    enabledNetworks: Network['symbol'][];
    unavailableCapabilities: TrezorDevice['unavailableCapabilities'];
}

const CoinsList = ({ onToggleFn, networks, enabledNetworks, unavailableCapabilities }: Props) => {
    const { device, isLocked } = useDevice();
    if (!device) return null;

    const isDeviceLocked = isLocked();
    const deviceVersion = device.features?.major_version === 1 ? 1 : 2;
    const isBtcOnly = isBitcoinOnly(device);
    return (
        <Wrapper>
            {networks.map(network => {
                const isDisabled = !!unavailableCapabilities?.[network.symbol] || isDeviceLocked;
                if (isDisabled) {
                    return (
                        <Tooltip
                            key={`${network.symbol}_${network.accountType}`}
                            placement="top"
                            content={
                                <UnavailableMessage
                                    deviceVersion={deviceVersion}
                                    isBtcOnly={isBtcOnly}
                                    type={unavailableCapabilities?.[network.symbol]}
                                />
                            }
                        >
                            <Coin
                                key={network.symbol}
                                symbol={network.symbol}
                                name={network.name}
                                selected={enabledNetworks.includes(network.symbol)}
                                disabled
                            />
                        </Tooltip>
                    );
                }
                return (
                    <Coin
                        key={network.symbol}
                        symbol={network.symbol}
                        name={network.name}
                        selected={enabledNetworks.includes(network.symbol)}
                        onClick={() =>
                            onToggleFn(network.symbol, !enabledNetworks.includes(network.symbol))
                        }
                    />
                );
            })}
        </Wrapper>
    );
};

export default CoinsList;
