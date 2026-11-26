import { useState } from 'react';

import { type CryptoId } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingAssetOption } from '@suite-common/trading';
import { Button } from '@trezor/components';
import { CaretDownIcon } from '@trezor/icons';

import { AssetLabel } from './AssetLabel';
import { AssetSelectModal } from './AssetSelectModal';

export type AssetSelectValue = CryptoId | undefined;

type AssetSelectProps = {
    value: AssetSelectValue;
    onChange: (cryptoId: CryptoId) => void;
    options: TradingAssetOption[];
    label: TranslationKey;
    'data-testid'?: string;
};

export const AssetSelect = ({
    value,
    onChange,
    options,
    label,
    'data-testid': dataTestId,
}: AssetSelectProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const selectedAsset = options.find(asset => asset.id === value);

    return (
        <>
            <Button
                intent="neutral"
                priority="secondary"
                iconRight={CaretDownIcon}
                onClick={() => setIsModalOpen(true)}
                flex="0 0 auto"
                data-testid={dataTestId}
            >
                {selectedAsset ? (
                    <AssetLabel asset={selectedAsset} symbolTestId="@asset-picker/display-symbol" />
                ) : (
                    <Translation id={label} />
                )}
            </Button>
            {isModalOpen && (
                <AssetSelectModal
                    options={options}
                    heading={label}
                    onSelect={asset => onChange(asset.id)}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
};
