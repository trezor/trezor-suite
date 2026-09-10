import { useCallback } from 'react';

import {
    type TradingAssetSellOption,
    createAssetNativeTokenOption,
    resolveAssetTokenOption,
    selectTradingInfo,
} from '@suite-common/trading';
import { type NetworkConfigWithoutTestnets } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { type TokensWithRates } from 'src/utils/wallet/tokenUtils';

export interface UseUpdateFormInputProps {
    closeModal: () => void;
    onAssetSelect: (asset: TradingAssetSellOption) => void;
}

export function useUpdateFormInput({ closeModal, onAssetSelect }: UseUpdateFormInputProps) {
    const { coins, platforms } = useSelector(selectTradingInfo);

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
                ...resolveAssetTokenOption({
                    coins,
                    platforms,
                    networkSymbol: account.symbol,
                    token,
                }),
                accountKey: account.key,
            });

            closeModal();
        },
        [closeModal, coins, onAssetSelect, platforms],
    );

    return {
        handleAccountClick,
        handleTokenClick,
    } as const;
}
