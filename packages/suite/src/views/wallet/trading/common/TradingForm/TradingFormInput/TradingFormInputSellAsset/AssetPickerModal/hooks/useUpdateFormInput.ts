import { useCallback } from 'react';

import {
    type TradingAssetSellOption,
    createAssetNativeTokenOption,
    createAssetTokenOption,
} from '@suite-common/trading';
import { type NetworkConfigWithoutTestnets } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { type TokensWithRates } from '#src/utils/wallet/tokenUtils';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetSellOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const handleAccountClick = useCallback(
        (account: Account) => {
            onAssetSelect({
                ...createAssetNativeTokenOption(
                    account.symbol as NetworkConfigWithoutTestnets['symbol'],
                ),
                accountKey: account.key,
            });

            closeModal();
        },
        [closeModal, onAssetSelect],
    );

    const handleTokenClick = useCallback(
        (token: TokensWithRates, account: Account) => {
            onAssetSelect({
                ...createAssetTokenOption(account.symbol, token),
                accountKey: account.key,
            });

            closeModal();
        },
        [closeModal, onAssetSelect],
    );

    return {
        handleAccountClick,
        handleTokenClick,
    } as const;
}
