import React from 'react';
import styled from 'styled-components';
import { borders, colorVariants, typography } from '@trezor/theme';
import { variables } from '@trezor/components';

const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    font-weight: normal;
    color: #fff;
    height: 18px;
    margin-top: 24px;
`;

const Text = styled.div`
    margin-right: 3px;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const Square = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 16px;
    background-color: #fff;
    color: ${colorVariants.standard.backgroundPrimaryDefault};
    border-radius: ${borders.radii.xxs};
    text-align: center;
    ${typography.hint}
`;

export const T3T1PromoLogo = () => (
    <LogoContainer>
        <Text>Trezor Safe</Text>
        <Square>5</Square>
    </LogoContainer>
);
