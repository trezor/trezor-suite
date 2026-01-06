import { memo } from 'react';

import { useModal } from 'src/components/suite/asset-picker/hooks';

import { AssetPickerInput, AssetPickerInputProps } from '../TradingFormInputAssetPicker';
import { AssetPickerModal, AssetPickerModalProps } from './AssetPickerModal/AssetPickerModal';

export interface TradingFormInputSellAssetProps {
    inputPlaceholder?: AssetPickerInputProps['placeholder'];
    inputLabel: AssetPickerInputProps['label'];
    inputName: AssetPickerInputProps['name'];
    inputDisabled?: AssetPickerInputProps['isDisabled'];

    /**
     * Make to sure to use `useCallback` to avoid breaking the `memo`
     */
    onAssetSelect: AssetPickerModalProps['onAssetSelect'];

    dataTestId?: string;
}

export const TradingFormInputSellAsset = memo(function TradingFormInputSellAssetInner({
    inputPlaceholder,
    inputLabel,
    inputName,
    inputDisabled,
    dataTestId,
    onAssetSelect,
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
            />
            {modal.open && (
                <AssetPickerModal
                    heading={inputLabel}
                    closeModal={modal.closeModal}
                    dataTestId={dataTestId}
                    onAssetSelect={onAssetSelect}
                />
            )}
        </>
    );
});
