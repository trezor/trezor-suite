import React from 'react';
import styled from 'styled-components';
import { P, Switch, Icon, variables, colors, Button } from '@trezor/components';
import { Translation } from '@suite-components';
import { NETWORKS } from '@wallet-config';
import { UnavailableCapability } from 'trezor-connect';
import { Network } from '@wallet-types';
import { Section, ActionColumn, Row } from '@suite-components/Settings';
import { useDeviceActionLocks } from '@suite-utils/hooks';
import Coin from '../Coin';

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 12px;
`;

const Title = styled.div``;

const CoinsGroupWrapper = styled.div``;

const ToggleButtons = styled.div`
    display: flex;
`;

const AdvancedSettings = styled.div`
    display: flex;
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
    /* todo: not in variables but is in design */
    font-weight: 500;
    margin-right: 4%;
    min-width: 120px;
    visibility: hidden;
`;

const UnavailableLabel = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
    white-space: nowrap;
`;

const SettingsIcon = styled(Icon)`
    position: relative;
    top: 2px;
    right: 4px;
`;

const CoinRow = styled(Row)`
    &:hover ${AdvancedSettings} {
        visibility: visible;
    }
`;

type FilterFn = (n: Network) => boolean;

interface Props {
    label: React.ReactNode;
    description?: React.ReactNode;
    onActivateAll: () => void;
    onDeactivateAll: () => void;
    onToggleOneFn: (symbol: Network['symbol'], visible: boolean) => void;
    filterFn: FilterFn;
    enabledNetworks: Network['symbol'][];
    type: 'mainnet' | 'testnet'; // used in tests
    unavailableCapabilities: { [key: string]: UnavailableCapability };
}

const Unavailable = ({ type }: { type: UnavailableCapability }) => {
    switch (type) {
        case 'no-capability':
            return <Translation id="FW_CAPABILITY_NO_CAPABILITY" />;
        case 'no-support':
            return <Translation id="FW_CAPABILITY_NO_SUPPORT" />;
        case 'update-required':
            return <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />;
        // case 'trezor-connect-outdated':
        default:
            return <Translation id="FW_CAPABILITY_CONNECT_OUTDATED" />;
    }
};

export default ({
    label,
    description,
    onActivateAll,
    onDeactivateAll,
    onToggleOneFn,
    filterFn,
    enabledNetworks,
    unavailableCapabilities,
    ...props
}: Props) => {
    const [actionEnabled] = useDeviceActionLocks();
    return (
        <CoinsGroupWrapper data-test="@settings/wallet/coins-group">
            <Section
                customHeader={
                    <Header>
                        <Title>{label}</Title>
                        {description && <P size="tiny">{description}</P>}
                        <ToggleButtons>
                            <Button
                                isDisabled={
                                    !actionEnabled ||
                                    NETWORKS.filter(filterFn).length === enabledNetworks.length
                                }
                                variant="tertiary"
                                size="small"
                                icon="CHECK"
                                onClick={() => onActivateAll()}
                                data-test={`@settings/wallet/coins-group/${props.type}/activate-all`}
                            >
                                <Translation id="TR_ACTIVATE_ALL" />
                            </Button>
                            <Button
                                isDisabled={!actionEnabled || enabledNetworks.length === 0}
                                variant="tertiary"
                                size="small"
                                icon="CROSS"
                                onClick={() => onDeactivateAll()}
                                data-test={`@settings/wallet/coins-group/${props.type}/deactivate-all`}
                            >
                                <Translation id="TR_DEACTIVATE_ALL" />
                            </Button>
                        </ToggleButtons>
                    </Header>
                }
            >
                {NETWORKS.filter(filterFn).map(network => (
                    <CoinRow key={network.symbol}>
                        <Coin symbol={network.symbol} name={network.name} />
                        <ActionColumn>
                            {/* hidden with display 'none' until implemented */}
                            <AdvancedSettings style={{ display: 'none' }}>
                                <SettingsIcon icon="SETTINGS" size={12} color={colors.BLACK25} />
                                <Translation id="TR_ADVANCED_SETTINGS" />
                            </AdvancedSettings>
                            {!unavailableCapabilities[network.symbol] && (
                                <Switch
                                    data-test={`@settings/wallet/network/${network.symbol}`}
                                    onChange={(visible: boolean) => {
                                        onToggleOneFn(network.symbol, visible);
                                    }}
                                    checked={enabledNetworks.includes(network.symbol)}
                                    disabled={!actionEnabled}
                                />
                            )}
                            {unavailableCapabilities[network.symbol] && (
                                <UnavailableLabel>
                                    <Unavailable type={unavailableCapabilities[network.symbol]} />
                                </UnavailableLabel>
                            )}
                        </ActionColumn>
                    </CoinRow>
                ))}
            </Section>
        </CoinsGroupWrapper>
    );
};
