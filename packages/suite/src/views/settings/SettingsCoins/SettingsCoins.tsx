import { useMemo } from 'react';

import { AnimatePresence, type MotionProps, motion } from 'framer-motion';
import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { selectFlags } from '@suite/flags';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { Anchor, SettingsAnchor } from '@suite/router';
import { selectHasExperimentalFeature } from '@suite/settings';
import { Context } from '@suite-common/message-system';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    changeCoinVisibility,
    selectDeviceSupportedNetworks,
    selectEnabledNetworks,
    selectShowRediscoverButton,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Box, Button, Column, Switch, Text, Tooltip, motionEasing } from '@trezor/components';
import { hasBitcoinOnlyFirmware, isBitcoinOnlyDevice } from '@trezor/device-utils';
import { OutlineHighlight, SectionItem, SettingsSection } from '@trezor/product-components';
import { breakpoints, spacingsPx } from '@trezor/theme';

import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { NetworkList } from 'src/components/suite/NetworkList/NetworkList';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { isCoinjoinSupportedSymbol } from 'src/utils/wallet/coinjoinUtils';

import { FirmwareTypeSuggestion } from './FirmwareTypeSuggestion';
import { NetworkSettingsSearchInput } from './NetworkSettingsSearchInput';
import { NoNetworkSearchResults } from './NoNetworkSearchResults';
import { useNetworkSettingsSearch } from './useNetworkSettingsSearch';

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
    const hasContentBelowTabletWidth = useIsContentBelowBreakpoint(breakpoints.tablet);
    const dispatch = useDispatch();
    const { firmwareTypeBannerClosed } = useSelector(selectFlags);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const {
        showUnsupportedCoins,
        supportedMainnets,
        unsupportedMainnets,
        supportedTestnets,
        unsupportedTestnets,
    } = useNetworkSupport();
    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);
    const { device, isLocked } = useDevice();
    const isDeviceLocked = !!device && isLocked();
    const { isDiscoveryRunning } = useDiscovery();
    const isDiscoveryButtonVisible = useSelector(state =>
        selectShowRediscoverButton(state, device),
    );
    const useTestnetNetworks = useSelector(selectHasExperimentalFeature('testnet-networks'));

    const allSearchableNetworks = useMemo(
        () => [
            ...supportedMainnets,
            ...(useTestnetNetworks ? supportedTestnets : []),
            ...(showUnsupportedCoins ? unsupportedMainnets : []),
            ...(showUnsupportedCoins && useTestnetNetworks ? unsupportedTestnets : []),
        ],
        [
            showUnsupportedCoins,
            supportedMainnets,
            supportedTestnets,
            unsupportedMainnets,
            unsupportedTestnets,
            useTestnetNetworks,
        ],
    );

    const {
        searchQuery,
        hasActiveSearch,
        hasNoSearchResults,
        filterNetworks,
        handleSearchChange,
        handleSearchClear,
    } = useNetworkSettingsSearch(allSearchableNetworks);

    const filteredSupportedMainnets = filterNetworks(supportedMainnets);
    const filteredSupportedTestnets = filterNetworks(supportedTestnets);
    const filteredUnsupportedMainnets = filterNetworks(unsupportedMainnets);
    const filteredUnsupportedTestnets = filterNetworks(unsupportedTestnets);

    const showSupportedMainnets = !hasActiveSearch || filteredSupportedMainnets.length > 0;
    const showSupportedTestnetsSection =
        useTestnetNetworks &&
        supportedTestnets.length > 0 &&
        (!hasActiveSearch || filteredSupportedTestnets.length > 0);
    const showUnsupportedSection =
        showUnsupportedCoins &&
        (unsupportedMainnets.length > 0 ||
            (useTestnetNetworks && unsupportedTestnets.length > 0)) &&
        (!hasActiveSearch ||
            filteredUnsupportedMainnets.length > 0 ||
            filteredUnsupportedTestnets.length > 0);
    const showUnsupportedMainnets =
        unsupportedMainnets.length > 0 &&
        (!hasActiveSearch || filteredUnsupportedMainnets.length > 0);
    const showUnsupportedTestnets =
        useTestnetNetworks &&
        unsupportedTestnets.length > 0 &&
        (!hasActiveSearch || filteredUnsupportedTestnets.length > 0);

    const supportedEnabledNetworks = enabledNetworks.filter(enabledNetwork =>
        deviceSupportedNetworkSymbols.includes(enabledNetwork),
    );

    const bitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);

    const onlyBitcoinNetworksEnabled =
        !!supportedEnabledNetworks.length &&
        supportedEnabledNetworks.every(symbol => isCoinjoinSupportedSymbol(symbol));
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);

    const showFirmwareTypeBanner =
        !firmwareTypeBannerClosed &&
        device &&
        !bitcoinOnlyDevice &&
        (bitcoinOnlyFirmware || (!bitcoinOnlyFirmware && onlyBitcoinNetworksEnabled));

    const onToggle = (symbol: NetworkSymbol, isEnabled?: boolean) => {
        dispatch(
            changeCoinVisibility({
                symbol,
                shouldBeVisible: isEnabled ?? true,
            }),
        );
    };

    const onSettings = (symbol: NetworkSymbol) => {
        dispatch(openModal({ type: 'advanced-coin-settings', symbol }));
    };

    const renderRightContent = ({
        networkSymbol,
        isEnabled,
    }: {
        networkSymbol: NetworkSymbol;
        isEnabled: boolean;
    }) => (
        <Switch
            size="medium"
            isChecked={isEnabled}
            data-testid={`@settings/wallet/network/${networkSymbol}/switch`}
            onChange={isChecked => onToggle(networkSymbol, isChecked)}
        />
    );

    const renderNetworkList = (networks: Network[]) => (
        <NetworkList
            networks={networks}
            enabledNetworks={enabledNetworks}
            onClick={onToggle}
            onSettings={onSettings}
            renderRightContent={({ network, isEnabled }) =>
                renderRightContent({
                    networkSymbol: network.symbol,
                    isEnabled,
                })
            }
        />
    );

    const startDiscovery = () => {
        dispatch(startOrRestartDiscoveryThunk());
    };

    const animation = getDiscoveryButtonAnimationConfig(!!isDiscoveryRunning);

    return (
        <SettingsLayout>
            <ContextMessage context={Context.getSettings('networks')} />

            <Column gap={16}>{showFirmwareTypeBanner && <FirmwareTypeSuggestion />}</Column>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_COINS" />}
                icon="coin"
                hasContainer={false}
            >
                <Anchor anchorId={SettingsAnchor.Crypto}>
                    {({ anchorId, anchorRef, shouldHighlight }) => (
                        <SectionItem
                            data-testid={anchorId}
                            ref={anchorRef}
                            shouldHighlight={shouldHighlight}
                        >
                            <Column gap={24} width="100%">
                                <NetworkSettingsSearchInput
                                    searchQuery={searchQuery}
                                    onSearchChange={handleSearchChange}
                                    onSearchClear={handleSearchClear}
                                />
                                {hasNoSearchResults ? (
                                    <NoNetworkSearchResults />
                                ) : (
                                    <Column gap={32} width="100%">
                                        {showSupportedMainnets &&
                                            renderNetworkList(filteredSupportedMainnets)}

                                        {showSupportedTestnetsSection && (
                                            <Anchor anchorId={SettingsAnchor.TestnetCrypto}>
                                                {({
                                                    anchorId: testnetAnchorId,
                                                    anchorRef: testnetAnchorRef,
                                                    shouldHighlight: testnetShouldHighlight,
                                                }) => (
                                                    <OutlineHighlight
                                                        shouldHighlight={testnetShouldHighlight}
                                                    >
                                                        <Box
                                                            ref={testnetAnchorRef}
                                                            data-testid={testnetAnchorId}
                                                            width="100%"
                                                        >
                                                            <Column gap={12} width="100%">
                                                                <Text typographyStyle="body-md">
                                                                    <Translation id="TR_TESTNET_COINS" />
                                                                </Text>
                                                                {renderNetworkList(
                                                                    filteredSupportedTestnets,
                                                                )}
                                                            </Column>
                                                        </Box>
                                                    </OutlineHighlight>
                                                )}
                                            </Anchor>
                                        )}

                                        {showUnsupportedSection && (
                                            <Anchor anchorId={SettingsAnchor.UnsupportedCrypto}>
                                                {({
                                                    anchorId: unsupportedAnchorId,
                                                    anchorRef: unsupportedAnchorRef,
                                                    shouldHighlight: unsupportedShouldHighlight,
                                                }) => (
                                                    <OutlineHighlight
                                                        shouldHighlight={unsupportedShouldHighlight}
                                                    >
                                                        <Box
                                                            ref={unsupportedAnchorRef}
                                                            data-testid={unsupportedAnchorId}
                                                            width="100%"
                                                        >
                                                            <Column gap={12} width="100%">
                                                                <Text typographyStyle="headline-sm">
                                                                    <Translation id="TR_UNSUPPORTED_COINS" />
                                                                </Text>
                                                                <Column gap={24} width="100%">
                                                                    {showUnsupportedMainnets &&
                                                                        renderNetworkList(
                                                                            filteredUnsupportedMainnets,
                                                                        )}
                                                                    {showUnsupportedTestnets && (
                                                                        <Column
                                                                            gap={12}
                                                                            width="100%"
                                                                        >
                                                                            <Text typographyStyle="body-md">
                                                                                <Translation id="TR_TESTNET_COINS" />
                                                                            </Text>
                                                                            {renderNetworkList(
                                                                                filteredUnsupportedTestnets,
                                                                            )}
                                                                        </Column>
                                                                    )}
                                                                </Column>
                                                            </Column>
                                                        </Box>
                                                    </OutlineHighlight>
                                                )}
                                            </Anchor>
                                        )}
                                    </Column>
                                )}
                            </Column>
                        </SectionItem>
                    )}
                </Anchor>
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
