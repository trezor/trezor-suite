import { memo, useMemo } from 'react';

import { type CryptoId } from 'invity-api';

import { type TranslationKey } from '@suite/intl';

import { useModal } from 'src/components/suite/asset-picker/hooks';

import {
    AssetOptionsProvider,
    AssetPickerInput,
    type AssetPickerInputProps,
} from '../TradingFormInputAssetPicker';
import { AssetPickerModal, type AssetPickerModalProps } from './AssetPickerModal/AssetPickerModal';

export type TradingFormInputBuyAssetProps = {
    inputPlaceholder?: AssetPickerInputProps['placeholder'];
    inputLabel: TranslationKey;
    inputName: AssetPickerInputProps['name'];
    inputDisabled?: AssetPickerInputProps['isDisabled'];

    /**
     * Make to sure to use `useCallback` to avoid breaking the `memo`
     */
    onAssetSelect: AssetPickerModalProps['onAssetSelect'];

    includedCryptoIds: CryptoId[];
};

export const TradingFormInputBuyAsset = memo(function TradingFormInputBuyAssetInner({
    inputPlaceholder,
    inputLabel,
    inputName,
    inputDisabled,
    includedCryptoIds,
    onAssetSelect,
}: TradingFormInputBuyAssetProps) {
    const modal = useModal();
    const includedCryptoIdsSet = useMemo(() => new Set(includedCryptoIds), [includedCryptoIds]);

    return (
        <AssetOptionsProvider includedCryptoIds={includedCryptoIdsSet}>
            <AssetPickerInput
                name={inputName}
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
