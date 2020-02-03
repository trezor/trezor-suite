import React from 'react';
import styled, { css } from 'styled-components';
import { variables, colors } from '@trezor/components-v2';

const COLOR_BORDER = colors.BLACK96;
const COLOR_TEXT_SECONDARY = colors.BLACK25;
const COLOR_TEXT_PRIMARY = colors.BLACK0;

const BoxRowWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 42px;
    padding: 10px 12px;

    & + & {
        border-top: solid 2px ${COLOR_BORDER};
    }
`;

const RowTitle = styled.div`
    display: flex;
    width: 160px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${COLOR_TEXT_SECONDARY};
`;

interface RowContentProps {
    alignContent?: 'right' | 'left';
}

const RowContent = styled.div<RowContentProps>`
    display: flex;
    flex: 1;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${COLOR_TEXT_PRIMARY};
    min-width: 0;

    ${props =>
        props.alignContent &&
        css`
            text-align: ${(props: RowContentProps) => props.alignContent};
            justify-content: ${(props: RowContentProps) =>
                props.alignContent === 'left' ? 'flex-start' : 'flex-end'};
        `}
`;
interface Props {
    title: React.ReactNode;
    alignContent?: 'right' | 'left';
    children?: React.ReactNode;
}

const BoxRow = ({ title, alignContent, children }: Props) => {
    return (
        <BoxRowWrapper>
            <RowTitle>{title}</RowTitle>
            <RowContent alignContent={alignContent}>{children}</RowContent>
        </BoxRowWrapper>
    );
};

export default BoxRow;
