import React from 'react';
import styled, { css } from 'styled-components';
import { variables, colors } from '@trezor/components';

const COLOR_BORDER = '#ccc';
const COLOR_TEXT_SECONDARY = colors.BLACK50;
const COLOR_TEXT_PRIMARY = '#444';

const BoxRowWrapper = styled.div<{ heading?: boolean }>`
    display: flex;
    align-items: center;
    height: 42px;
    padding: 10px 12px;

    ${props =>
        props.heading &&
        css`
            background: ${colors.BLACK96};
        `}

    & + & {
        border-top: solid 1px ${COLOR_BORDER};
    }
`;

const RowTitle = styled.div`
    display: flex;
    width: 160px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${COLOR_TEXT_SECONDARY};
    text-transform: uppercase;
`;

interface RowContentProps {
    alignContent?: 'right' | 'left';
}

const RowContent = styled.div<RowContentProps>`
    display: flex;
    flex: 1;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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
    isHeading?: boolean;
    alignContent?: 'right' | 'left';
    children?: React.ReactNode;
}

const BoxRow = ({ title, isHeading, alignContent = 'right', children }: Props) => {
    return (
        <BoxRowWrapper heading={isHeading}>
            <RowTitle>{title}</RowTitle>
            <RowContent alignContent={alignContent}>{children}</RowContent>
        </BoxRowWrapper>
    );
};

export default BoxRow;
