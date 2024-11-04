import styled from 'styled-components';
import { AnimatePresence, MotionProps, motion } from 'framer-motion';

import {
    startDiscoveryThunk,
    selectDeviceModel,
    selectDeviceSupportedNetworks,
} from '@suite-common/wallet-core';
import { Button, motionEasing, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { BITCOIN_ONLY_NETWORKS } from '@suite-common/suite-constants';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';
import { spacingsPx } from '@trezor/theme';

import {
    DeviceBanner,
    SettingsLayout,
    SettingsSection,
    SettingsSectionItem,
} from 'src/components/settings';
import { CoinGroup, TooltipSymbol, Translation } from 'src/components/suite';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import {
    useDevice,
    useRediscoveryNeeded,
    useDispatch,
    useSelector,
    useDiscovery,
} from 'src/hooks/suite';
import { selectEnabledNetworks } from 'src/reducers/wallet/settingsReducer';

import { FirmwareTypeSuggestion } from './FirmwareTypeSuggestion';
import { selectSuiteFlags } from '../../../reducers/suite/suiteReducer';

const DiscoveryButtonWrapper = styled.div`
    margin-top: ${spacingsPx.xl};
    width: fit-content;
`;

const StyledSettingsSection = styled(SettingsSection)`
    overflow: hidden;
`;

const StyledSectionItem = styled(SettingsSectionItem)`
    > div {
        flex-direction: column;
    }
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
    const { firmwareTypeBannerClosed } = useSelector(selectSuiteFlags);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isDiscoveryButtonVisible = useRediscoveryNeeded();
    const { supportedMainnets, unsupportedMainnets, supportedTestnets } = useNetworkSupport();
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const deviceModel = useSelector(selectDeviceModel);
    const { device, isLocked } = useDevice();
    const isDeviceLocked = !!device && isLocked();
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();

    const supportedEnabledNetworks = enabledNetworks.filter(enabledNetwork =>
        deviceSupportedNetworkSymbols.includes(enabledNetwork),
    );

    const bitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const bitcoinOnlyNetworks = BITCOIN_ONLY_NETWORKS;

    const onlyBitcoinNetworksEnabled =
        !!supportedEnabledNetworks.length &&
        supportedEnabledNetworks.every(network => bitcoinOnlyNetworks.includes(network));
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

            <StyledSettingsSection title={<Translation id="TR_COINS" />} icon="coin">
                <StyledSectionItem anchorId={SettingsAnchor.Crypto}>
                    <CoinGroup networks={supportedMainnets} enabledNetworks={enabledNetworks} />
                </StyledSectionItem>
            </StyledSettingsSection>

            <SettingsSection
                title={
                    <>
                        <Translation id="TR_TESTNET_COINS" />
                        <TooltipSymbol
                            content={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                        />
                    </>
                }
                icon="coin"
            >
                <SettingsSectionItem anchorId={SettingsAnchor.TestnetCrypto}>
                    <CoinGroup networks={supportedTestnets} enabledNetworks={enabledNetworks} />
                </SettingsSectionItem>
            </SettingsSection>

            {deviceModel === DeviceModelInternal.T1B1 && !bitcoinOnlyFirmware && (
                <SettingsSection
                    title={
                        <>
                            <Translation id="TR_UNSUPPORTED_COINS" />
                            <TooltipSymbol
                                content={<Translation id="TR_UNSUPPORTED_COINS_DESCRIPTION" />}
                            />
                        </>
                    }
                    icon="coin"
                >
                    <SettingsSectionItem anchorId={SettingsAnchor.UnsupportedCrypto}>
                        <CoinGroup
                            networks={unsupportedMainnets}
                            enabledNetworks={enabledNetworks}
                        />
                    </SettingsSectionItem>
                </SettingsSection>
            )}

            <AnimatePresence>
                {isDiscoveryButtonVisible && (
                    <motion.div {...animation} key="discover-button">
                        <DiscoveryButtonWrapper>
                            <Tooltip
                                content={
                                    isDeviceLocked ? (
                                        <Translation id="TR_CONNECT_YOUR_DEVICE" />
                                    ) : null
                                }
                            >
                                <Button onClick={startDiscovery} isDisabled={isDeviceLocked}>
                                    <Translation id="TR_DISCOVERY_NEW_COINS" />
                                </Button>
                            </Tooltip>
                        </DiscoveryButtonWrapper>
                    </motion.div>
                )}
            </AnimatePresence>
        </SettingsLayout>
    );
};
