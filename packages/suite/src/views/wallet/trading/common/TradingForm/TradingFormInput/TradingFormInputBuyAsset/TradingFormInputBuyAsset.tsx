import { memo, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { useModal } from 'src/components/suite/asset-picker/hooks';

import { AssetOptionsProvider } from './AssetOptionsContext';
import { AssetPickerInput, type AssetPickerInputProps } from '../TradingFormInputAssetPicker';
import { AssetPickerModal, type AssetPickerModalProps } from './AssetPickerModal/AssetPickerModal';

export interface TradingFormInputBuyAssetProps {
    inputPlaceholder?: AssetPickerInputProps['placeholder'];
    inputLabel: AssetPickerInputProps['label'];
    inputName: AssetPickerInputProps['name'];
    inputDisabled?: AssetPickerInputProps['isDisabled'];

    /**
     * Make to sure to use `useCallback` to avoid breaking the `memo`
     */
    onAssetSelect: AssetPickerModalProps['onAssetSelect'];

    includedCryptoIds: CryptoId[];
    excludedCryptoId?: CryptoId | undefined;
}

export const TradingFormInputBuyAsset = memo(function TradingFormInputBuyAssetInner({
    inputPlaceholder,
    inputLabel,
    inputName,
    inputDisabled,
    includedCryptoIds,
    excludedCryptoId,
    onAssetSelect,
}: TradingFormInputBuyAssetProps) {
    const modal = useModal();
    const includedCryptoIdsSet = useMemo(() => new Set(includedCryptoIds), [includedCryptoIds]);
    const excludedCryptoIdsSet = useMemo(
        () => (excludedCryptoId ? new Set([excludedCryptoId]) : new Set<CryptoId>()),
        [excludedCryptoId],
    );

    return (
        <AssetOptionsProvider
            includedCryptoIds={includedCryptoIdsSet}
            excludedCryptoIds={excludedCryptoIdsSet}
        >
            <AssetPickerInput
                name={inputName}
                label={inputLabel}
                placeholder={inputPlaceholder}
                isDisabled={inputDisabled}
                onClick={modal.openModal}
                dataTestId="@trading/buy/asset-picker"
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
