import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { colors, Icon, Input, CoinLogo } from '@trezor/components';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    background: ${colors.NEUE_BG_WHITE};
    width: 100%;
    margin-top: 10px;
`;

const CoinsFilter = styled.div`
    display: flex;
    margin-top: 16px;
    flex-wrap: wrap;
`;

const OuterCircle = styled.div<{ isSelected?: boolean; isMobile?: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3px;
    background: white;
    border-radius: 50%;
    border: 1px solid ${props => (props.isSelected ? colors.NEUE_BG_GREEN : 'transparent')};
    transition: all 0.3;

    margin-bottom: 8px;
    margin-right: ${props => (props.isMobile ? '12px' : '6px')};
`;

const StyledInput = styled(Input)`
    && {
        background-color: ${colors.NEUE_BG_GRAY};
        border: none;
    }
`;

const StyledCoinLogo = styled(CoinLogo)<{
    isSelected?: boolean;
    filterActivated?: boolean;
}>`
    cursor: pointer;

    ${props =>
        props.filterActivated &&
        css`
            opacity: ${props.isSelected ? '1' : '0.5'};
        `}
`;

const SearchIconWrapper = styled.div``;

interface Props {
    networks: Account['symbol'][];
    onChange: (value: string) => void;
    isMobile?: boolean;
}

const AccountSearchBox = (props: Props) => {
    const [value, setValue] = useState<string | undefined>(undefined);
    const [coinFilter, setCoinFilter] = useState<string | undefined>(undefined);

    const onChange = (value: string) => {
        setValue(value);
        props.onChange(value);
    };

    return (
        <Wrapper>
            <StyledInput
                value={value}
                onChange={e => {
                    onChange(e.target.value);
                    if (coinFilter) {
                        setCoinFilter(undefined);
                    }
                }}
                innerAddon={
                    <SearchIconWrapper>
                        <Icon icon="SEARCH" size={16} color={colors.NEUE_TYPE_DARK_GREY} />
                    </SearchIconWrapper>
                }
                addonAlign="left"
                textIndent={16}
                variant="small"
                placeholder="Filter accounts"
                noTopLabel
                noError
            />
            <CoinsFilter>
                {props.networks.map(n => (
                    <OuterCircle isMobile={props.isMobile} isSelected={coinFilter === n}>
                        <StyledCoinLogo
                            symbol={n}
                            size={props.isMobile ? 24 : 16}
                            filterActivated={!!coinFilter}
                            isSelected={coinFilter === n}
                            onClick={() => {
                                const alreadySelected = coinFilter === n;
                                if (alreadySelected) {
                                    onChange('');
                                    setCoinFilter(undefined);
                                } else {
                                    onChange(`symbol:${n}`);
                                    setCoinFilter(n);
                                }
                            }}
                        />
                    </OuterCircle>
                ))}
            </CoinsFilter>
        </Wrapper>
    );
};

export default AccountSearchBox;
