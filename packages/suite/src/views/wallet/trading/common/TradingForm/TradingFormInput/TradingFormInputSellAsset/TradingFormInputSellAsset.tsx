import { memo, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { useTradingAssetPickerModal } from 'src/hooks/wallet/trading/form/common/useTradingAssetPickerModal';

import {
    AssetOptionsProvider,
    AssetPickerInput,
    type AssetPickerInputProps,
} from '../TradingFormInputAssetPicker';
import { AssetPickerModal, type AssetPickerModalProps } from './AssetPickerModal/AssetPickerModal';

export type TradingFormInputSellAssetProps = {
    inputPlaceholder?: AssetPickerInputProps['placeholder'];
    inputLabel: AssetPickerInputProps['label'];
    inputName: AssetPickerInputProps['name'];
    inputDisabled?: AssetPickerInputProps['isDisabled'];
    inputBottomText?: AssetPickerInputProps['bottomText'];

    /**
     * Make to sure to use `useCallback` to avoid breaking the `memo`
     */
    onAssetSelect: AssetPickerModalProps['onAssetSelect'];

    includedCryptoIds: CryptoId[] | undefined;
};

export const TradingFormInputSellAsset = memo(function TradingFormInputSellAssetInner({
    inputPlaceholder,
    inputLabel,
    inputName,
    inputDisabled,
    inputBottomText,
    onAssetSelect,
    includedCryptoIds,
}: TradingFormInputSellAssetProps) {
    const modal = useTradingAssetPickerModal();
    const includedCryptoIdsSet = useMemo(() => new Set(includedCryptoIds), [includedCryptoIds]);

    return (
        <AssetOptionsProvider includedCryptoIds={includedCryptoIdsSet}>
            <AssetPickerInput
                name={inputName}
                label={inputLabel}
                placeholder={inputPlaceholder}
                isDisabled={inputDisabled}
                onClick={modal.openModal}
                dataTestId="@trading/sell/asset-picker"
                bottomText={inputBottomText}
            />
            {modal.open && (
                <AssetPickerModal
                    heading={inputLabel}
                    closeModal={modal.closeModal}
                    onAssetSelect={onAssetSelect}
                />
            )}
        </AssetOptionsProvider>
    );
});
