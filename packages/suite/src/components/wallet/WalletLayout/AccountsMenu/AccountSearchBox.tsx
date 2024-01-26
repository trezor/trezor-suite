import styled, { useTheme } from 'styled-components';

import { Icon, Input } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { useSelector, useAccountSearch, useTranslation } from 'src/hooks/suite';

const InputWrapper = styled.div<{ showCoinFilter: boolean }>`
    flex: 1;
`;

const StyledInput = styled(Input)`
    input {
        /* to line up with the coin filter  */
        padding-left: 46px;
        min-height: 38px;
        background-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
        border-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    }
`;

const SearchIconWrapper = styled.div``;

export const AccountSearchBox = () => {
    const theme = useTheme();
    const { translationString } = useTranslation();
    const { setCoinFilter, searchString, setSearchString } = useAccountSearch();
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const device = useSelector(selectDevice);

    const unavailableCapabilities = device?.unavailableCapabilities ?? {};
    const supportedNetworks = enabledNetworks.filter(symbol => !unavailableCapabilities[symbol]);

    const showCoinFilter = supportedNetworks.length > 1;

    const onClear = () => {
        setSearchString(undefined);
        setCoinFilter(undefined);
    };

    return (
        <InputWrapper showCoinFilter={showCoinFilter}>
            <StyledInput
                value={searchString ?? ''}
                onChange={e => {
                    setSearchString(e.target.value);
                }}
                innerAddon={
                    <SearchIconWrapper>
                        <Icon icon="SEARCH" size={16} color={theme.iconDefault} />
                    </SearchIconWrapper>
                }
                innerAddonAlign="left"
                size="small"
                placeholder={translationString('TR_SEARCH')}
                showClearButton="always"
                onClear={onClear}
                data-test="@account-menu/search-input"
            />
        </InputWrapper>
    );
};
