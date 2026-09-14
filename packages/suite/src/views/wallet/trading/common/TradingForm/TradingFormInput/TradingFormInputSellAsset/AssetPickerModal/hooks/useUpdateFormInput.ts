import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import {
    type TradingAssetSellOption,
    getAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkConfigWithoutTestnets } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetSellOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { resolveAssetTokenOption } = useTradingAssets();

    const handleAccountClick = useCallback(
        (account: Account) => {
            onAssetSelect({
                ...getAssetNativeTokenOption(
                    networkConfigDeps,
                    account.symbol as NetworkConfigWithoutTestnets['symbol'],
                ),
                accountKey: account.key,
            });

            closeModal();
        },
        [networkConfigDeps, closeModal, onAssetSelect],
    );

    const handleTokenClick = useCallback(
        (token: TokensWithRates, account: Account) => {
            onAssetSelect({
                ...resolveAssetTokenOption(account.symbol, token),
                accountKey: account.key,
            });

            closeModal();
        },
        [closeModal, onAssetSelect, resolveAssetTokenOption],
    );

    return {
        handleAccountClick,
        handleTokenClick,
    } as const;
}
