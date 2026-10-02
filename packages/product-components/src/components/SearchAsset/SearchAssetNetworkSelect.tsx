import { Row, Select, Text } from '@trezor/components';

import { type SearchAssetSelectConfig, useNetworkSelect } from './hooks/useNetworkSelect';

type SearchAssetNetworkSelectProps = {
    selectConfig: SearchAssetSelectConfig;
    onMenuOpen?: () => void;
};

export const SearchAssetNetworkSelect = ({
    selectConfig,
    onMenuOpen,
}: SearchAssetNetworkSelectProps) => {
    const { options, selectedOption } = useNetworkSelect(selectConfig);
    const dataTestIdBase = '@asset-picker/search';

    return (
        <Select
            options={options}
            value={selectedOption}
            onChange={option => selectConfig.onChange(option.value)}
            onMenuOpen={onMenuOpen}
            size="small"
            isClean
            formatOptionLabel={(option, meta) => (
                <Row
                    gap={8}
                    data-testid={
                        meta.context === 'menu'
                            ? `${dataTestIdBase}/filter/select-option/${option.value ?? 'all-networks'}`
                            : `${dataTestIdBase}/filter/select-option-value/${option.value ?? 'all-networks'}`
                    }
                >
                    {option.icon}
                    <Text typographyStyle="body-sm" textWrap="nowrap">
                        {option.label}
                    </Text>
                </Row>
            )}
            data-testid={`${dataTestIdBase}/filter`}
            openMenuOnFocus={false}
            menuAlign="end"
        />
    );
};
