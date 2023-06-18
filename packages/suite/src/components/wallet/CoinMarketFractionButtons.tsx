import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

const Left = styled.div`
    display: flex;
`;

const SmallButton = styled(Button).attrs(props => ({
    ...props,
    variant: 'tertiary',
    type: 'button',
    size: 'small',
}))`
    margin-right: 10px;
`;

interface Props {
    onFractionClick: (divisor: number) => void;
    onAllClick: () => void;
    disabled?: boolean;
}

export const FractionButtons = ({ disabled, onFractionClick, onAllClick }: Props) => (
    <Wrapper>
        <Left>
            <SmallButton isDisabled={disabled} onClick={() => onFractionClick(4)}>
                1/4
            </SmallButton>
            <SmallButton isDisabled={disabled} onClick={() => onFractionClick(3)}>
                1/3
            </SmallButton>
            <SmallButton isDisabled={disabled} onClick={() => onFractionClick(2)}>
                1/2
            </SmallButton>
            <SmallButton isDisabled={disabled} onClick={() => onAllClick()}>
                <Translation id="TR_FRACTION_BUTTONS_ALL" />
            </SmallButton>
        </Left>
    </Wrapper>
);
