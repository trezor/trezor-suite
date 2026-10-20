import { useMemo } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { Column, Input, Select } from '@trezor/components';

export const CUSTOM_RPC_URL_OPTION_VALUE = '__custom__';

type CustomNetworkRpcUrlFieldProps = {
    rpcUrls: string[];
    selectedValue: string;
    customUrl: string;
    customUrlError?: string;
    onSelectedValueChange: (value: string) => void;
    onCustomUrlChange: (value: string) => void;
};

export const CustomNetworkRpcUrlField = ({
    rpcUrls,
    selectedValue,
    customUrl,
    customUrlError,
    onSelectedValueChange,
    onCustomUrlChange,
}: CustomNetworkRpcUrlFieldProps) => {
    const { translationString } = useTranslation();

    const options = useMemo(
        () => [
            ...rpcUrls.map(url => ({ value: url, label: url })),
            {
                value: CUSTOM_RPC_URL_OPTION_VALUE,
                label: <Translation id="TR_USE_CUSTOM_RPC_URL" />,
            },
        ],
        [rpcUrls],
    );

    const selectedOption = options.find(({ value }) => value === selectedValue);

    return (
        <Column gap={12} alignItems="stretch" width={340} maxWidth="100%">
            <Select
                size="small"
                options={options}
                value={selectedOption}
                onChange={({ value }) => onSelectedValueChange(value)}
                isMenuFullWidth
                data-testid="@add-custom-network/rpc-url-select"
            />
            {selectedValue === CUSTOM_RPC_URL_OPTION_VALUE && (
                <Input
                    size="small"
                    value={customUrl}
                    onChange={event => onCustomUrlChange(event.target.value.trim())}
                    placeholder={translationString('TR_CUSTOM_RPC_URL')}
                    hasError={!!customUrlError}
                    bottomText={customUrlError}
                    data-testid="@add-custom-network/custom-rpc-url-input"
                />
            )}
        </Column>
    );
};
