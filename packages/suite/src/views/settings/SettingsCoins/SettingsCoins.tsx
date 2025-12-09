import { AnimatePresence, MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import {
    selectEnabledNetworks,
    selectShowRediscoverButton,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Button, Column, Tooltip, motionEasing } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { DeviceBanner } from 'src/components/settings/DeviceBanner';
import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { SettingsSection } from 'src/components/settings/SettingsSection';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { CoinGroup } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';

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
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { supportedMainnets } = useNetworkSupport();
    const { device, isLocked } = useDevice();
    const isDeviceLocked = !!device && isLocked();
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();
    const isDiscoveryButtonVisible = useSelector(state =>
        selectShowRediscoverButton(state, device),
    );

    const showDeviceBanner = device?.connected === false; // device is remembered and disconnected

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
            </Column>

            <SettingsSection title={<Translation id="TR_COINS" />} icon="coin">
                <SettingsSectionItem anchorId={SettingsAnchor.Crypto}>
                    <CoinGroup networks={supportedMainnets} enabledNetworks={enabledNetworks} />
                </SettingsSectionItem>
            </SettingsSection>

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
