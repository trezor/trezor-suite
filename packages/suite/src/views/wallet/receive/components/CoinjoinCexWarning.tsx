import React from 'react';
import styled, { useTheme } from 'styled-components';
import { useDispatch } from 'react-redux';
import { darken } from 'polished';
import { Button, Icon, variables, Warning } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { hideCoinjoinCexWarning } from '@suite-actions/suiteActions';

const StyledWarning = styled(Warning)`
    justify-content: space-between;
    margin-bottom: 16px;

    ${variables.SCREEN_QUERY.MOBILE} {
        display: grid;
        grid-template-columns: 1fr auto;
    }
`;

const InfoIcon = styled(Icon)`
    width: 38px;
    height: 38px;
    background: ${({ theme }) => theme.TYPE_LIGHT_ORANGE};
    border-radius: 50%;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-self: start;
    }
`;

const Text = styled.div`
    margin: 0 auto 0 18px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    > :last-child {
        margin-top: 6px;
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
        font-size: ${variables.FONT_SIZE.SMALL};
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }
`;

const StyledButton = styled(Button)`
    background: ${({ theme }) => theme.TYPE_DARK_ORANGE};

    :hover,
    :focus,
    :active {
        background: ${({ theme }) => darken(theme.HOVER_DARKEN_FILTER, theme.TYPE_DARK_ORANGE)};
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1/3;
        margin-top: 16px;
    }
`;

export const CoinjoinCexWarning = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    return (
        <StyledWarning>
            <InfoIcon icon="INFO" size={20} color={theme.TYPE_DARK_ORANGE} />

            <Text>
                <p>
                    <Translation id="TR_COINJOIN_CEX_WARNING" />
                </p>
                <p>
                    <Translation id="TR_COINJOIN_CEX_EXPLANATION" />
                </p>
            </Text>

            <StyledButton onClick={() => dispatch(hideCoinjoinCexWarning())}>
                <Translation id="TR_COINJOIN_CEX_DISMISS" />
            </StyledButton>
        </StyledWarning>
    );
};
