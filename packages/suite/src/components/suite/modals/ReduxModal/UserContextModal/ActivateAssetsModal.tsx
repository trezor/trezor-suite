import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { selectIsActivateAssetsBannerClosed, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { preserveModal, removePreserveModal } from '@suite/modal';
import { useDispatch } from '@suite-common/redux-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    changeCoinVisibility,
    selectEnabledNetworks,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Banner, Column, Modal, Switch, motionEasing } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { NetworkList } from 'src/components/suite/NetworkList/NetworkList';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDiscovery, useSelector } from 'src/hooks/suite';

import { AdvancedCoinSettingsModal } from './AdvancedCoinSettingsModal/AdvancedCoinSettingsModal';

export const bannerAnimationConfig = {
    initial: { opacity: 1, transform: 'scale(1)' },
    exit: { opacity: 0, transform: 'scale(0.9)', height: 0, margin: 0 },
    transition: {
        duration: 0.33,
        ease: motionEasing.transition,
        height: {
            duration: 0.23,
            ease: motionEasing.transition,
        },
        opacity: {
            duration: 0.2,
            ease: motionEasing.transition,
        },
    },
};

type ActivateAssetsModalProps = {
    onCancel: () => void;
};

export const ActivateAssetsModal = ({ onCancel }: ActivateAssetsModalProps) => {
    const dispatch = useDispatch();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isActivateAssetsBannerClosed = useSelector(selectIsActivateAssetsBannerClosed);
    const { supportedMainnets } = useNetworkSupport();
    const { isDiscoveryRunning } = useDiscovery();

    const [pendingNetworks, setPendingNetworks] = useState<NetworkSymbol[]>(enabledNetworks);
    const [isApplyPending, setIsApplyPending] = useState(false);
    const [advancedSettingsSymbol, setAdvancedSettingsSymbol] = useState<
        NetworkSymbol | undefined
    >();

    const closeAdvancedSettings = () => setAdvancedSettingsSymbol(undefined);

    useEffect(() => {
        dispatch(preserveModal());

        return () => {
            dispatch(removePreserveModal());
        };
    }, [dispatch]);

    const hasChanges = useMemo(() => {
        const toEnable = pendingNetworks.filter(symbol => !enabledNetworks.includes(symbol));
        const toDisable = enabledNetworks.filter(symbol => !pendingNetworks.includes(symbol));

        return toEnable.length > 0 || toDisable.length > 0;
    }, [pendingNetworks, enabledNetworks]);

    const handleToggle = (symbol: NetworkSymbol, shouldBeVisible: boolean) => {
        setPendingNetworks(prev => {
            if (!shouldBeVisible) {
                return prev.filter(s => s !== symbol);
            }

            if (prev.includes(symbol)) {
                return prev;
            }

            return [...prev, symbol];
        });
    };

    const applyChanges = useCallback(() => {
        const toEnable = pendingNetworks.filter(symbol => !enabledNetworks.includes(symbol));
        const toDisable = enabledNetworks.filter(symbol => !pendingNetworks.includes(symbol));

        toEnable.forEach(symbol =>
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: true })),
        );
        toDisable.forEach(symbol =>
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: false })),
        );

        if (toEnable.length > 0) {
            dispatch(startOrRestartDiscoveryThunk());
        }

        onCancel();
    }, [dispatch, enabledNetworks, onCancel, pendingNetworks]);

    const onSave = () => {
        if (isDiscoveryRunning) {
            setIsApplyPending(true);

            return;
        }

        applyChanges();
    };

    useEffect(() => {
        if (!isApplyPending || isDiscoveryRunning) return;

        applyChanges();
    }, [applyChanges, isApplyPending, isDiscoveryRunning]);

    const handleBannerClose = () => {
        dispatch(setFlag({ key: 'activateAssetsBannerClosed', value: true }));
    };

    if (advancedSettingsSymbol) {
        return (
            <AdvancedCoinSettingsModal
                symbol={advancedSettingsSymbol}
                onCancel={closeAdvancedSettings}
                onBackClick={closeAdvancedSettings}
            />
        );
    }

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_DASHBOARD_MODAL_ACTIVATE_ASSETS_TITLE" />}
            description={<Translation id="TR_DASHBOARD_MODAL_ACTIVATE_ASSETS_DESC" />}
            width={600}
            bottomContent={
                hasChanges ? (
                    <Modal.Button
                        onClick={onSave}
                        isLoading={isApplyPending}
                        isDisabled={isApplyPending}
                        data-testid="@modal/activate-assets/save"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                ) : null
            }
        >
            <Column gap={16}>
                <AnimatePresence>
                    {!isActivateAssetsBannerClosed && (
                        <motion.div {...bannerAnimationConfig}>
                            <Banner
                                intent="neutral"
                                icon={InfoIcon}
                                title={<Translation id="TR_DASHBOARD_MODAL_ACTIVATE_ASSETS_NOTE" />}
                                rightContent={
                                    <Banner.Button
                                        size="small"
                                        onClick={handleBannerClose}
                                        data-testid="@modal/activate-assets/got-it"
                                    >
                                        <Translation id="TR_GOT_IT" />
                                    </Banner.Button>
                                }
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                <NetworkList
                    networks={supportedMainnets}
                    enabledNetworks={pendingNetworks}
                    onClick={handleToggle}
                    onSettings={setAdvancedSettingsSymbol}
                    renderRightContent={({ network, isEnabled }) => (
                        <Switch
                            size="medium"
                            isChecked={isEnabled}
                            data-testid={`@settings/wallet/network/${network.symbol}/switch`}
                            onChange={isChecked => handleToggle(network.symbol, isChecked)}
                        />
                    )}
                    ignoreDeviceLock
                />
            </Column>
        </Modal>
    );
};
