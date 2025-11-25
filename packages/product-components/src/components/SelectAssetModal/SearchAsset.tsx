import styled from 'styled-components';

import { Icon, Input, Row, Select, Text } from '@trezor/components';

import { CoinLogo } from '../CoinLogo/CoinLogo';
import { SearchAssetSelectConfig, useNetworkSelect } from './hooks/useNetworkSelect';

const SelectWrapper = styled.div`
    /* stylelint-disable selector-class-pattern */
    .react-select__value-container {
        justify-content: flex-end;
    }

    .react-select__control {
        &:focus,
        &:focus-within {
            border-color: transparent;
        }

        &:hover .react-select__indicators {
            color: unset;
        }
    }

    .react-select__single-value {
        color: ${({ theme }) => theme.textSubdued};
    }

    .react-select__dropdown-indicator > svg {
        fill: ${({ theme }) => theme.iconSubdued};
        stroke: ${({ theme }) => theme.iconSubdued};
    }

    &:hover .react-select__dropdown-indicator > svg {
        fill: ${({ theme }) => theme.iconSubdued};
        stroke: ${({ theme }) => theme.iconSubdued};
    }
    /* stylelint-enable selector-class-pattern */
`;

export type SearchAssetProps = {
    searchPlaceholder: string;
    search: string;
    setSearch: (value: string) => void;
    'data-testid'?: string;
    selectConfig?: SearchAssetSelectConfig;
    autoFocus?: boolean;
};

export const SearchAsset = ({
    searchPlaceholder,
    search,
    setSearch,
    'data-testid': dataTestId,
    selectConfig,
    autoFocus = false,
}: SearchAssetProps) => {
    const { options, selectedOption } = useNetworkSelect(selectConfig);

    const networkSelect = selectConfig ? (
        <SelectWrapper>
            <Select
                options={options}
                value={selectedOption}
                onChange={option => selectConfig.onChange(option.value)}
                size="small"
                isClean
                formatOptionLabel={(option, meta) => (
                    <Row
                        gap={8}
                        data-testid={
                            meta.context === 'menu'
                                ? `${dataTestId}/select-option/${option.value ?? 'all-networks'}`
                                : `${dataTestId}/select-option-value/${option.value ?? 'all-networks'}`
                        }
                    >
                        {option.value && (
                            <CoinLogo size={20} symbol={option.value} type="network" />
                        )}
                        <Text typographyStyle="hint">{option.label}</Text>
                    </Row>
                )}
                width="auto"
                minValueWidth="170px"
                data-testid={`${dataTestId}/select`}
                isRenderedInModal
                openMenuOnFocus={false}
            />
        </SelectWrapper>
    ) : undefined;

    return (
        <Input
            data-testid={dataTestId}
            placeholder={searchPlaceholder}
            value={search}
            onChange={event => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            leftContent={<Icon name="magnifyingGlass" variant="tertiary" size="medium" />}
            rightContent={networkSelect}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
        />
    );
};
