import styled, { css } from 'styled-components';

import { useTheme, Icon, Input, CoinLogo } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { useSelector, useAccountSearch, useTranslation } from 'src/hooks/suite';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.BG_WHITE};
    width: 100%;
    margin-top: 16px;
`;

const CoinsFilter = styled.div`
    display: flex;
    padding-top: 16px;
    flex-wrap: wrap;
`;

const OuterCircle = styled.div<{ isSelected?: boolean; isMobile?: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3px;
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 50%;
    border: 2px solid ${({ isSelected, theme }) => (isSelected ? theme.BG_GREEN : 'transparent')};
    transition: all 0.3;
    cursor: pointer;

    margin-bottom: 8px;
    margin-right: ${props => (props.isMobile ? '12px' : '4px')};
`;

const InputWrapper = styled.div<{ showCoinFilter: boolean }>`
    ${props =>
        !props.showCoinFilter &&
        css`
            /* additional space under input if we are not showing coin filter */

            /* one could think why not to remove a margin from coin filter so it can be here regardless of whether coin filter is shown */

            /* but hold your horses, it is actually essential there is top PADDING on coin filter as a click to the area triggers deactivating the filter */
            margin-bottom: 12px;
        `}
`;

const StyledInput = styled(Input)`
    && {
        background-color: ${({ theme }) => theme.BG_GREY_ALT};
        border-color: ${({ theme }) => theme.BG_GREY_ALT};
        transition: border-color 0.2s;

        :focus {
            border-color: ${({ theme }) => theme.STROKE_GREY_ALT};
        }
    }
`;

const StyledCoinLogo = styled(CoinLogo)<{
    isSelected?: boolean;
    filterActivated?: boolean;
}>`
    ${props =>
        props.filterActivated &&
        css`
            opacity: ${props.isSelected ? '1' : '0.5'};
        `}
`;

const SearchIconWrapper = styled.div``;

interface AccountSearchBoxProps {
    isMobile?: boolean;
}

export const AccountSearchBox = (props: AccountSearchBoxProps) => {
    const theme = useTheme();
    const { translationString } = useTranslation();
    const { coinFilter, setCoinFilter, searchString, setSearchString } = useAccountSearch();
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
        <Wrapper>
            <InputWrapper showCoinFilter={showCoinFilter}>
                <StyledInput
                    value={searchString ?? ''}
                    onChange={e => {
                        setSearchString(e.target.value);
                    }}
                    innerAddon={
                        <SearchIconWrapper>
                            <Icon icon="SEARCH" size={16} color={theme.TYPE_DARK_GREY} />
                        </SearchIconWrapper>
                    }
                    addonAlign="left"
                    variant="small"
                    placeholder={translationString('TR_SEARCH')}
                    noTopLabel
                    noError
                    clearButton="always"
                    onClear={onClear}
                    data-test="@account-menu/search-input"
                />
            </InputWrapper>
            {showCoinFilter && (
                <CoinsFilter
                    onClick={() => {
                        setCoinFilter(undefined);
                    }}
                >
                    {supportedNetworks.map(n => (
                        <OuterCircle
                            key={n}
                            isMobile={props.isMobile}
                            isSelected={coinFilter === n}
                            onClick={e => {
                                e.stopPropagation();
                                // select the coin or deactivate if it's already selected
                                setCoinFilter(coinFilter === n ? undefined : n);
                            }}
                        >
                            <StyledCoinLogo
                                data-test={`@account-menu/filter/${n}`}
                                symbol={n}
                                size={props.isMobile ? 24 : 16}
                                filterActivated={!!coinFilter}
                                data-test-activated={coinFilter === n}
                                isSelected={coinFilter === n}
                            />
                        </OuterCircle>
                    ))}
                </CoinsFilter>
            )}
        </Wrapper>
    );
};
