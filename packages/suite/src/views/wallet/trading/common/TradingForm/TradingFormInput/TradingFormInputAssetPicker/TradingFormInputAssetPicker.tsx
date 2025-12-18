import { memo } from 'react';

import { CryptoId } from 'invity-api';

import { useModal } from 'src/components/suite/asset-picker/hooks';

import { AssetOptionsProvider } from './AssetOptionsContext';
import { AssetPickerInput, AssetPickerInputProps } from './AssetPickerInput';
import { AssetPickerModal, AssetPickerModalProps } from './AssetPickerModal/AssetPickerModal';

export interface TradingFormInputAssetPickerProps {
    inputPlaceholder?: AssetPickerInputProps['placeholder'];
    inputLabel: AssetPickerInputProps['label'];
    inputName: AssetPickerInputProps['name'];
    inputDisabled?: AssetPickerInputProps['isDisabled'];

    /**
     * Make to sure to use `useCallback` to avoid breaking the `memo`
     */
    onAssetSelect: AssetPickerModalProps['onAssetSelect'];

    enabledCryptoIds?: Set<CryptoId> | undefined;
    disabledCryptoIds?: Set<CryptoId> | undefined;
    dataTestId?: string;
}

export const TradingFormInputAssetPicker = memo(function TradingFormInputAssetPickerInner({
    inputPlaceholder,
    inputLabel,
    inputName,
    inputDisabled,
    dataTestId,
    enabledCryptoIds,
    disabledCryptoIds,
    onAssetSelect,
}: TradingFormInputAssetPickerProps) {
    const modal = useModal();

    return (
        <AssetOptionsProvider
            enabledCryptoIds={enabledCryptoIds}
            disabledCryptoIds={disabledCryptoIds}
        >
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
        </AssetOptionsProvider>
    );
});
