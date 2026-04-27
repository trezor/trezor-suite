import { useCallback, useEffect, useMemo, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { selectIsActivateAssetsBannerClosed, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { preserveModal, removePreserveModal } from '@suite/modal';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    changeCoinVisibility,
    selectEnabledNetworks,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Banner, Column, Modal, motionEasing } from '@trezor/components';

import { CoinGroup } from 'src/components/suite';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';

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
    const [advancedSettingsSymbol, setAdvancedSettingsSymbol] = useState<NetworkSymbol | null>(
        null,
    );
    const [isApplyPending, setIsApplyPending] = useState(false);

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

    return (
        <>
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
                            <Translation id="TR_ADD" />
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
                                    icon="info"
                                    title={
                                        <Translation id="TR_DASHBOARD_MODAL_ACTIVATE_ASSETS_NOTE" />
                                    }
                                    rightContent={
                                        <Banner.Button size="small" onClick={handleBannerClose}>
                                            <Translation id="TR_GOT_IT" />
                                        </Banner.Button>
                                    }
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <CoinGroup
                        networks={supportedMainnets}
                        enabledNetworks={pendingNetworks}
                        onToggle={handleToggle}
                        onSettings={setAdvancedSettingsSymbol}
                        ignoreDeviceLock
                    />
                </Column>
            </Modal>
            {advancedSettingsSymbol !== null && (
                <AdvancedCoinSettingsModal
                    symbol={advancedSettingsSymbol}
                    onCancel={() => setAdvancedSettingsSymbol(null)}
                />
            )}
        </>
    );
};
