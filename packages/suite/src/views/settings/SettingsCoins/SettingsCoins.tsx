import { AnimatePresence, MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { Context } from '@suite-common/message-system';
import {
    selectDeviceSupportedNetworks,
    selectEnabledNetworks,
    selectShowRediscoverButton,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Button, Column, Tooltip, motionEasing } from '@trezor/components';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';
import { spacingsPx } from '@trezor/theme';

import { DeviceBanner } from 'src/components/settings/DeviceBanner';
import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { SettingsSection } from 'src/components/settings/SettingsSection';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { CoinGroup } from 'src/components/suite';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { selectHasExperimentalFeature, selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';
import { isCoinjoinSupportedSymbol } from 'src/utils/wallet/coinjoinUtils';

import { FirmwareTypeSuggestion } from './FirmwareTypeSuggestion';

const DiscoveryButtonWrapper = styled.div`
    margin-top: ${spacingsPx.xl};
    width: fit-content;
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
    const { showUnsupportedCoins, supportedMainnets, unsupportedMainnets, supportedTestnets } =
        useNetworkSupport();
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const { device, isLocked } = useDevice();
    const isDeviceLocked = !!device && isLocked();
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const isDiscoveryButtonVisible = useSelector(state =>
        selectShowRediscoverButton(state, device),
    );
    const useTestnetNetworks = useSelector(selectHasExperimentalFeature('testnet-networks'));

    const supportedEnabledNetworks = enabledNetworks.filter(enabledNetwork =>
        deviceSupportedNetworkSymbols.includes(enabledNetwork),
    );

    const bitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);

    const onlyBitcoinNetworksEnabled =
        !!supportedEnabledNetworks.length &&
        supportedEnabledNetworks.every(symbol => isCoinjoinSupportedSymbol(symbol));
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);

    const showDeviceBanner = device?.connected === false; // device is remembered and disconnected
    const showFirmwareTypeBanner =
        !firmwareTypeBannerClosed &&
        device &&
        !bitcoinOnlyDevice &&
        (bitcoinOnlyFirmware || (!bitcoinOnlyFirmware && onlyBitcoinNetworksEnabled));

    const startDiscovery = () => {
        dispatch(startOrRestartDiscoveryThunk());
    };

    const animation = getDiscoveryButtonAnimationConfig(!!isDiscoveryRunning);

    return (
        <SettingsLayout>
            <ContextMessage context={Context.getSettings('networks')} />

            <Column gap={16}>
                {showDeviceBanner && (
                    <DeviceBanner
                        title={
                            <Translation id="TR_SETTINGS_COINS_BANNER_DESCRIPTION_REMEMBERED_DISCONNECTED" />
                        }
                    />
                )}

                {showFirmwareTypeBanner && <FirmwareTypeSuggestion />}
            </Column>

            <SettingsSection title={<Translation id="TR_COINS" />} icon="coin">
                <SettingsSectionItem anchorId={SettingsAnchor.Crypto}>
                    <CoinGroup networks={supportedMainnets} enabledNetworks={enabledNetworks} />
                </SettingsSectionItem>
            </SettingsSection>

            {useTestnetNetworks && (
                <SettingsSection
                    tooltipText={<Translation id="TR_TESTNET_COINS_DESCRIPTION" />}
                    title={<Translation id="TR_TESTNET_COINS" />}
                    icon="coin"
                >
                    <SettingsSectionItem anchorId={SettingsAnchor.TestnetCrypto}>
                        <CoinGroup networks={supportedTestnets} enabledNetworks={enabledNetworks} />
                    </SettingsSectionItem>
                </SettingsSection>
            )}

            {showUnsupportedCoins && (
                <SettingsSection
                    tooltipText={<Translation id="TR_UNSUPPORTED_COINS_DESCRIPTION" />}
                    title={<Translation id="TR_UNSUPPORTED_COINS" />}
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
                                isActive={isDeviceLocked}
                                content={<Translation id="TR_CONNECT_YOUR_DEVICE" />}
                            >
                                <Button
                                    data-testid="@settings-coins/discovery-button"
                                    onClick={startDiscovery}
                                    isDisabled={isDeviceLocked}
                                >
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
