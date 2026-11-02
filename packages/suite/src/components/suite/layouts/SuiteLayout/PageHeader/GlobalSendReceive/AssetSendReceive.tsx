import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetContractAddress,
    selectWalletAssetName,
    selectWalletAssetSymbol,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { buildGlobalReceiveAssetOption } from '@suite-common/receive';
import { type AssetAccountsRootState, type WalletAssetKey } from '@suite-common/wallet-core';
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
    const symbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetSymbol(state, assetKey),
    );
    const contractAddress = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetContractAddress(state, assetKey),
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const name = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetName(state, assetKey),
    );
    const sendTargets = useSelector((state: AssetAccountsRootState) =>
        selectAssetSendTargets(state, assetKey),
    );
    const receiveAccounts = useSelector((state: ReceiveAccountsByNetworkSymbolState) =>
        selectReceiveAccountsByNetworkSymbol(state, symbol),
    );
    const [activeModal, setActiveModal] = useState<GlobalSendReceiveType>(null);
    const { reportOpen } = useGlobalSendReceiveAnalytics();
    const { startSend, startReceive } = useStartSendReceiveWithAnalytics();

    if (symbol === undefined || name === undefined) {
        return null;
    }

    const asset = buildGlobalReceiveAssetOption({ symbol, contractAddress, tokenSymbol, name });

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
            asset={asset}
            sendTargets={sendTargets}
        />
    );
};
