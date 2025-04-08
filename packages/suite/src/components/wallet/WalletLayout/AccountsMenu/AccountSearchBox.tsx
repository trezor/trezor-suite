import { useRef } from 'react';

import styled, { useTheme } from 'styled-components';

import { Icon, Input } from '@trezor/components';
import { borders } from '@trezor/theme';

import { useAccountSearch, useTranslation } from 'src/hooks/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledInput = styled(Input)`
    input {
        /* to line up with the coin filter  */
        padding-left: 46px;
        min-height: 38px;
        background-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
        border-radius: ${borders.radii.full};
        border-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    }
`;

export const AccountSearchBox = () => {
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { translationString } = useTranslation();
    const { setCoinFilter, searchString, setSearchString } = useAccountSearch();

    const onClear = () => {
        setSearchString(undefined);
        setCoinFilter(undefined);
    };

    return (
        <StyledInput
            value={searchString ?? ''}
            onChange={e => {
                setSearchString(e.target.value);
            }}
            innerAddon={
                <Icon
                    name="magnifyingGlass"
                    size={16}
                    color={theme.iconDefault}
                    onClick={() => {
                        inputRef?.current?.select();
                    }}
                    cursor="pointer"
                />
            }
            innerAddonAlign="start"
            size="small"
            placeholder={translationString('TR_WALLET')}
            showClearButton="always"
            onClear={onClear}
            data-testid="@account-menu/search-input"
            innerRef={inputRef}
        />
    );
};
