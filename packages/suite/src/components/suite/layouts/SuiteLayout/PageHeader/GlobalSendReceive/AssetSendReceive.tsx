import { useState } from 'react';
import { useSelector } from 'react-redux';

import { createAssetId } from '@suite-common/asset-types';
import {
    type AssetAccountsRootState,
    type HomeAssetTableState,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';

import { GlobalSendReceiveView } from './GlobalSendReceiveView';
import { useGlobalSendReceiveAnalytics } from './hooks/useGlobalSendReceiveAnalytics';
import { useStartSendReceiveWithAnalytics } from './hooks/useStartSendReceiveWithAnalytics';
import { selectAssetSendTargets } from './selectAssetSendTargets';
import {
    type ReceiveAccountsByNetworkSymbolState,
    selectReceiveAccountsByNetworkSymbol,
} from './selectReceiveAccountsByNetworkSymbol';

const getOnlyItem = <T,>(items: readonly T[]): T | undefined =>
    items.length === 1 ? items[0] : undefined;

type AssetSendReceiveProps = {
    assetKey: WalletAssetKey;
};

export const AssetSendReceive = ({ assetKey }: AssetSendReceiveProps) => {
    const networkSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetNetworkSymbol(state, assetKey),
    );
    const contractAddress = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetContractAddress(state, assetKey),
    );
    const sendTargets = useSelector((state: AssetAccountsRootState) =>
        selectAssetSendTargets(state, assetKey),
    );
    const receiveAccounts = useSelector((state: ReceiveAccountsByNetworkSymbolState) =>
        selectReceiveAccountsByNetworkSymbol(state, networkSymbol),
    );
    const [activeModal, setActiveModal] = useState<GlobalSendReceiveType>(null);
    const { reportOpen } = useGlobalSendReceiveAnalytics();
    const { startSend, startReceive } = useStartSendReceiveWithAnalytics();

    if (networkSymbol === undefined) {
        return null;
    }

    const assetId = createAssetId({ networkSymbol, contractAddress });

    const handleOpen = (modal: NonNullable<GlobalSendReceiveType>) => {
        const sendTarget = modal === 'send' ? getOnlyItem(sendTargets) : undefined;
        const receiveAccount = modal === 'receive' ? getOnlyItem(receiveAccounts) : undefined;

        if (sendTarget) {
            startSend(sendTarget);

            return;
        }

        if (receiveAccount) {
            startReceive(receiveAccount);

            return;
        }

        reportOpen(modal, 'asset-header');
        setActiveModal(modal);
    };

    return (
        <GlobalSendReceiveView
            activeModal={activeModal}
            onOpen={handleOpen}
            onClose={() => setActiveModal(null)}
            assetId={assetId}
            sendTargets={sendTargets}
        />
    );
};
