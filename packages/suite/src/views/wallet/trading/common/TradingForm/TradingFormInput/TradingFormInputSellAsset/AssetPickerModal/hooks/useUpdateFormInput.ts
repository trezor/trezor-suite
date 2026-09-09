import { useCallback } from 'react';

import {
    type TradingAssetSellOption,
    createAssetNativeTokenOption,
    useTradingAssets,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetSellOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const { resolveAssetTokenOption } = useTradingAssets();

    const handleAccountClick = useCallback(
        (account: Account) => {
            onAssetSelect({
                ...createAssetNativeTokenOption(account.symbol),
                accountKey: account.key,
            });

            closeModal();
        },
        [closeModal, onAssetSelect],
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
