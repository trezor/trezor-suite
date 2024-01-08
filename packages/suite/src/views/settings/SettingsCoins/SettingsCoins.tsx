import styled from 'styled-components';
import { AnimatePresence, MotionProps, motion } from 'framer-motion';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';
import { selectSupportedNetworks, startDiscoveryThunk } from '@suite-common/wallet-core';
import { Button, motionEasing } from '@trezor/components';

import { DeviceBanner, SettingsLayout, SettingsSection } from 'src/components/settings';
import { CoinGroup, SectionItem, TooltipSymbol, Translation } from 'src/components/suite';
import { useEnabledNetworks } from 'src/hooks/settings/useEnabledNetworks';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import {
    useDevice,
    useRediscoveryNeeded,
    useDispatch,
    useSelector,
    useDiscovery,
} from 'src/hooks/suite';

import { FirmwareTypeSuggestion } from './FirmwareTypeSuggestion';
import { spacingsPx } from '@trezor/theme';

const StyledButton = styled(Button)`
    margin: ${spacingsPx.md} 0 0 ${spacingsPx.sm};
`;
const StyledSettingsSection = styled(SettingsSection)`
    overflow: hidden;
`;

const getDiscoveryButtonAnimationConfig = (isConfirmed: boolean): MotionProps => ({
    initial: {
        height: 0,
        opacity: 0,
        translateY: 16,
        translateX: -28,
        scale: 0.96,
    },
    animate: {
        height: 'auto',
        opacity: 1,
        translateY: 0,
        translateX: 0,
        scale: 1,
        transition: {
            ease: motionEasing.transition,
            duration: 0.2,
            opacity: {
                duration: 0.35,
                ease: motionEasing.transition,
            },
        },
    },
    exit: {
        height: 0,
        opacity: 0,
        translateY: 16,
        translateX: isConfirmed ? 0 : -24,
        scale: 0.96,
        transformOrigin: 'bottom left',
        transition: {
            ease: motionEasing.transition,
            duration: 0.2,
            opacity: {
                ease: motionEasing.enter,
            },
        },
    },
});

export const SettingsCoins = () => {
    const { firmwareTypeBannerClosed } = useSelector(state => state.suite.flags);

    const isDiscoveryButtonVisible = useRediscoveryNeeded();
    const { mainnets, testnets, enabledNetworks, setEnabled } = useEnabledNetworks();
    const supportedNetworks = useSelector(selectSupportedNetworks);
    const supportedEnabledNetworks = enabledNetworks.filter(enabledNetwork =>
        supportedNetworks.includes(enabledNetwork),
    );

    const { anchorRef: anchorRefCrypto, shouldHighlight: shouldHighlightCrypto } = useAnchor(
        SettingsAnchor.Crypto,
    );
    const { anchorRef: anchorRefTestnetCrypto, shouldHighlight: shouldHighlightTestnetCrypto } =
        useAnchor(SettingsAnchor.TestnetCrypto);

    const { device } = useDevice();
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();

    const bitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const bitcoinNetworks = ['btc', 'test', 'regtest'];

    const onlyBitcoinNetworksEnabled =
        !!supportedEnabledNetworks.length &&
        supportedEnabledNetworks.every(coin => bitcoinNetworks.includes(coin));
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);

    const showDeviceBanner = device?.connected === false; // device is remembered and disconnected

    const showFirmwareTypeBanner =
        !firmwareTypeBannerClosed &&
        device &&
        !bitcoinOnlyDevice &&
        (bitcoinOnlyFirmware || (!bitcoinOnlyFirmware && onlyBitcoinNetworksEnabled));

    const startDiscovery = () => {
        dispatch(startDiscoveryThunk());
    };

    const animation = getDiscoveryButtonAnimationConfig(!!isDiscoveryRunning);

    return (
        <SettingsLayout>
            {showDeviceBanner && (
                <DeviceBanner
                    title={
                        <Translation id="TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED" />
                    }
                />
            )}

            {showFirmwareTypeBanner && <FirmwareTypeSuggestion />}

            <StyledSettingsSection title={<Translation id="TR_COINS" />} icon="COIN">
                <SectionItem ref={anchorRefCrypto} shouldHighlight={shouldHighlightCrypto}>
                    <CoinGroup
                        networks={mainnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </SectionItem>

                <AnimatePresence>
                    {isDiscoveryButtonVisible && (
                        <motion.div {...animation} key="discover-button">
                            <StyledButton onClick={startDiscovery}>
                                <Translation id="TR_DISCOVERY_NEW_COINS" />
                            </StyledButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </StyledSettingsSection>

            <SettingsSection
                title={
                    <>
                        <Translation id="TR_TESTNET_COINS" />{' '}
                        <TooltipSymbol
                            content={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                        />
                    </>
                }
                icon="COIN"
            >
                <SectionItem
                    ref={anchorRefTestnetCrypto}
                    shouldHighlight={shouldHighlightTestnetCrypto}
                >
                    <CoinGroup
                        networks={testnets}
                        onToggle={setEnabled}
                        selectedNetworks={enabledNetworks}
                    />
                </SectionItem>
            </SettingsSection>
        </SettingsLayout>
    );
};
