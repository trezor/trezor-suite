import React from 'react';
import styled from 'styled-components';
import { Button, variables, useTheme } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';

const ButtonBadge = styled(Button)`
    margin: 0px 8px;
    padding: 3px 4px;
    font-size: 10px;
    line-height: 1;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    background: ${({ theme }) => theme.STROKE_GREY_ALT};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface TokensCountProps {
    count: number;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const TokensCount = ({ count, onClick }: TokensCountProps) => {
    const theme = useTheme();
    return (
        <ButtonBadge
            icon="PLUS"
            variant="tertiary"
            size={10}
            color={theme.TYPE_LIGHT_GREY}
            onClick={onClick}
        >
            <Translation id="TR_TOKENS_COUNT" values={{ count }} />
        </ButtonBadge>
    );
};
