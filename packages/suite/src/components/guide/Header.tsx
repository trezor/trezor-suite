import React from 'react';
import * as guideActions from '@suite-actions/guideActions';
import { useActions } from '@suite-hooks';
import styled, { css } from 'styled-components';
import { Icon, variables, useTheme } from '@trezor/components';

const HeaderWrapper = styled.div<{ noLabel?: boolean }>`
    display: flex;
    align-items: center;
    padding: 22px 22px 27px 22px;
    ${props =>
        props.noLabel &&
        css`
            justify-content: space-between;
        `}
`;

const ActionButton = styled.button`
    border: 0;
    background: none;
    left: auto;
    cursor: pointer;
`;

const MainLabel = styled.div`
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: left;
    color: ${props => props.theme.TYPE_DARK_GREY};
    width: 100%;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding: 0 15px;
    width: 100%;
`;

interface Props {
    back?: () => void;
    label?: string | JSX.Element;
}

const Header = ({ back, label }: Props) => {
    const theme = useTheme();
    const { close } = useActions({
        close: guideActions.close,
    });

    return (
        <HeaderWrapper noLabel={!label}>
            {back && (
                <>
                    <ActionButton onClick={back}>
                        <Icon icon="ARROW_LEFT_LONG" size={24} color={theme.TYPE_LIGHT_GREY} />
                    </ActionButton>
                    {label && <Label>{label}</Label>}
                </>
            )}
            {!back && label && <MainLabel>{label}</MainLabel>}
            <ActionButton onClick={close}>
                <Icon icon="CROSS" size={24} color={theme.TYPE_LIGHT_GREY} />
            </ActionButton>
        </HeaderWrapper>
    );
};

export default Header;
