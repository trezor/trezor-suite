import { memo } from 'react';

import { CryptoId } from 'invity-api';

import { useModal } from 'src/components/suite/asset-picker/hooks';

import { AssetPickerInput, AssetPickerInputProps } from '../TradingFormInputAssetPicker';
import { AssetPickerModal, AssetPickerModalProps } from './AssetPickerModal/AssetPickerModal';

export interface TradingFormInputSellAssetProps {
    inputPlaceholder?: AssetPickerInputProps['placeholder'];
    inputLabel: AssetPickerInputProps['label'];
    inputName: AssetPickerInputProps['name'];
    inputDisabled?: AssetPickerInputProps['isDisabled'];
    inputBottomText?: AssetPickerInputProps['bottomText'];

    /**
     * Make to sure to use `useCallback` to avoid breaking the `memo`
     */
    onAssetSelect: AssetPickerModalProps['onAssetSelect'];
    enabledCryptoIds?: Set<CryptoId> | undefined;

    dataTestId?: string;
}

export const TradingFormInputSellAsset = memo(function TradingFormInputSellAssetInner({
    inputPlaceholder,
    inputLabel,
    inputName,
    inputDisabled,
    inputBottomText,
    dataTestId,
    onAssetSelect,
    enabledCryptoIds,
}: TradingFormInputSellAssetProps) {
    const modal = useModal();

    return (
        <>
            <AssetPickerInput
                name={inputName}
                label={inputLabel}
                placeholder={inputPlaceholder}
                isDisabled={inputDisabled}
                onClick={modal.openModal}
                dataTestId={dataTestId}
                bottomText={inputBottomText}
            />
            {modal.open && (
                <AssetPickerModal
                    heading={inputLabel}
                    closeModal={modal.closeModal}
                    dataTestId={dataTestId}
                    onAssetSelect={onAssetSelect}
                    enabledCryptoIds={enabledCryptoIds}
                />
            )}
        </>
    );
});
