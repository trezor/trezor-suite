import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    changeCoinVisibility,
    selectEnabledNetworks,
    startOrRestartDiscoveryThunk,
} from '@suite-common/wallet-core';
import { Modal } from '@trezor/components';

import { CoinGroup } from 'src/components/suite';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { AdvancedCoinSettingsModal } from './AdvancedCoinSettingsModal/AdvancedCoinSettingsModal';

type ActivateAssetsModalProps = {
    onCancel: () => void;
};

export const ActivateAssetsModal = ({ onCancel }: ActivateAssetsModalProps) => {
    const dispatch = useDispatch();
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { supportedMainnets } = useNetworkSupport();

    const [pendingNetworks, setPendingNetworks] = useState<NetworkSymbol[]>(enabledNetworks);
    const [advancedSettingsSymbol, setAdvancedSettingsSymbol] = useState<NetworkSymbol | null>(
        null,
    );

    // Merge with the current store state so any concurrent changes stay reflected.
    const effectiveEnabledNetworks = useMemo(
        () => Array.from(new Set([...pendingNetworks, ...enabledNetworks])),
        [pendingNetworks, enabledNetworks],
    );

    const selectedInModal = useMemo(
        () => supportedMainnets.filter(({ symbol }) => pendingNetworks.includes(symbol)),
        [supportedMainnets, pendingNetworks],
    );

    const hasAnySelected = selectedInModal.length > 0;

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

    const onAdd = () => {
        const toEnable = pendingNetworks.filter(symbol => !enabledNetworks.includes(symbol));
        const toDisable = enabledNetworks.filter(symbol => !pendingNetworks.includes(symbol));

        toEnable.forEach(symbol =>
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: true })),
        );
        toDisable.forEach(symbol =>
            dispatch(changeCoinVisibility({ symbol, shouldBeVisible: false })),
        );

        dispatch(startOrRestartDiscoveryThunk());
        onCancel();
    };

    return (
        <>
            <Modal
                onCancel={onCancel}
                heading={<Translation id="TR_COINS" />}
                description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC" />}
                width={600}
                bottomContent={
                    hasAnySelected ? (
                        <Modal.Button
                            onClick={onAdd}
                            isDisabled={!hasAnySelected}
                            data-testid="@modal/activate-assets/add"
                        >
                            <Translation id="TR_ADD" />
                        </Modal.Button>
                    ) : null
                }
            >
                <CoinGroup
                    networks={supportedMainnets}
                    enabledNetworks={effectiveEnabledNetworks}
                    onToggle={handleToggle}
                    onSettings={setAdvancedSettingsSymbol}
                />
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
