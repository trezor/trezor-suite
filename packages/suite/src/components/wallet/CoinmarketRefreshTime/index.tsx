import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { variables, Loader } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    justify-self: flex-end;
    flex: 1;
    align-items: center;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const RefreshLabel = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const RefreshTime = styled.div`
    margin-left: 4px;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

interface Props {
    isLoading: boolean;
    seconds: number;
    refetchInterval: number;
    label: ReactElement;
}

const CoinmarketRefreshTime = ({ isLoading, seconds, refetchInterval, label }: Props) => (
    <Wrapper>
        {!isLoading && <RefreshLabel>{label}</RefreshLabel>}
        <RefreshTime>
            {isLoading ? (
                <Loader size={15} />
            ) : (
                <span>
                    {`0:${refetchInterval - seconds < 10 ? '0' : ''}${refetchInterval - seconds}`}
                </span>
            )}
        </RefreshTime>
    </Wrapper>
);

export default CoinmarketRefreshTime;
