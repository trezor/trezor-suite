import React, { useState, useEffect, useCallback } from 'react';
import { Translation } from '@suite-components';
import { Box } from '@onboarding-components';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { variables, Icon, Button, useTheme } from '@trezor/components';
import { useActions, useSelector } from '@suite-hooks';
import TrezorConnect from 'trezor-connect';
import { BlockbookUrl } from '@wallet-types/blockbook';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { isDesktop, isWeb } from '@suite-utils/env';
import CustomBackend from './CustomBackend';
import Tor from './Tor';

const AdvancedSetupWrapper = styled.div`
    width: 100%;
    text-align: center;
`;

const Boxes = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-bottom: 36px;
    & > * + * {
        margin-top: 24px;
    }
`;

const BackendGrid = styled.div<{ border?: boolean }>`
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 3fr 0.5fr;
    grid-template-rows: 1fr;
    gap: 9px 18px;
    padding: 9px 0 0 0;
    margin: 0 0 12px 0;

    ${props =>
        props.border &&
        `
        border-top: 1px solid ${props.theme.STROKE_GREY};
    `}
`;

const BottomWrapper = styled.div`
    margin-top: 20px;
`;

const ActiveLabel = styled.div`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const InputLabel = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Buttons = styled.div`
    display: flex;
    justify-content: center;
`;

const IconWrapper = styled.div`
    margin: 0 28px 0 0;
`;

interface Props {
    networks: Network[];
    children: React.ReactNode;
}

const AdvancedSetup = ({ networks, children }: Props) => {
    const [customBackendOpen, setCustomBackendOpen] = useState(false);
    const [torOpen, setTorOpen] = useState(false);
    const [networksWithBlockbook, setNetworksWithBlockbook] = useState<Network[]>([]);
    const theme = useTheme();

    const { addBlockbookUrl, removeBlockbookUrl } = useActions({
        addBlockbookUrl: walletSettingsActions.addBlockbookUrl,
        removeBlockbookUrl: walletSettingsActions.removeBlockbookUrl,
    });

    const { blockbookUrls, tor } = useSelector(state => ({
        blockbookUrls: state.wallet.settings.blockbookUrls,
        tor: state.suite.tor,
    }));

    const filterNetworks = useCallback(async networks => {
        const filteredNetworks = await Promise.all<Network>(
            networks.map(async (network: Network) => {
                const result = await TrezorConnect.getCoinInfo({ coin: network.symbol });
                if (result.success) {
                    return network;
                }
            }),
        );
        setNetworksWithBlockbook(filteredNetworks);
    }, []);

    useEffect(() => {
        filterNetworks(networks);
    }, [networks, filterNetworks]);

    const toggleCustomBackend = () => {
        setCustomBackendOpen(!customBackendOpen);
    };

    const restoreDefaultBackends = () => {
        blockbookUrls.forEach((b: BlockbookUrl) => removeBlockbookUrl(b));
    };

    const toggleTor = () => {
        setTorOpen(!torOpen);
    };

    return (
        <AdvancedSetupWrapper>
            <Boxes>
                {networks.length >= 1 && (
                    <Box
                        heading={<Translation id="TR_ONBOARDING_CUSTOM_BACKEND_HEADING" />}
                        description={<Translation id="TR_ONBOARDING_CUSTOM_BACKEND_DESCRIPTION" />}
                        expandable
                        expanded={customBackendOpen}
                        expandableIcon={
                            <IconWrapper>
                                {blockbookUrls.length ? (
                                    <Icon icon="CHECK" size={24} color={theme.TYPE_LIGHT_GREY} />
                                ) : (
                                    <Icon icon="PLUS" size={24} color={theme.TYPE_LIGHT_GREY} />
                                )}
                            </IconWrapper>
                        }
                        onToggle={toggleCustomBackend}
                    >
                        <>
                            <BackendGrid>
                                <ActiveLabel>
                                    {networks.length} <Translation id="TR_ACTIVE" />
                                </ActiveLabel>
                                <InputLabel>
                                    <Translation id="SETTINGS_ADV_COIN_BLOCKBOOK_TITLE" />
                                </InputLabel>
                            </BackendGrid>
                            {networksWithBlockbook.map(network => (
                                <CustomBackend
                                    key={network.symbol}
                                    network={network}
                                    blockbookUrls={blockbookUrls}
                                    addBlockbookUrl={addBlockbookUrl}
                                    removeBlockbookUrl={removeBlockbookUrl}
                                />
                            ))}
                            {blockbookUrls.length >= 1 && (
                                <BottomWrapper>
                                    <Button variant="secondary" onClick={restoreDefaultBackends}>
                                        <Translation id="TR_RESTORE_DEFAULT_SETTINGS" />
                                    </Button>
                                </BottomWrapper>
                            )}
                        </>
                    </Box>
                )}
                {(isDesktop() || (isWeb() && tor)) && (
                    <Box
                        heading={<Translation id="TR_TOR" />}
                        description={
                            <Translation
                                id="TR_TOR_DESCRIPTION"
                                values={{
                                    lineBreak: <br />,
                                }}
                            />
                        }
                        expandable
                        expanded={torOpen}
                        expandableIcon={
                            <IconWrapper>
                                {tor ? (
                                    <Icon icon="CHECK" size={24} color={theme.TYPE_LIGHT_GREY} />
                                ) : (
                                    <Icon icon="PLUS" size={24} color={theme.TYPE_LIGHT_GREY} />
                                )}
                            </IconWrapper>
                        }
                        onToggle={toggleTor}
                    >
                        <Tor tor={tor} />
                    </Box>
                )}
            </Boxes>
            <Buttons>{children}</Buttons>
        </AdvancedSetupWrapper>
    );
};

export default AdvancedSetup;
