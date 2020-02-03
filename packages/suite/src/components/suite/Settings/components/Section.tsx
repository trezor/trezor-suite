import React from 'react';
import styled, { css } from 'styled-components';
import { colors } from '@trezor/components-v2';
import SectionHeader from './SectionHeader';

interface SectionProps {
    borderless?: boolean;
}

const SectionWrapper = styled.div<SectionProps>`
    border-radius: 6px;
    margin-top: 16px;
    margin-bottom: 30px;
    text-align: left;

    ${({ borderless }) =>
        !borderless &&
        css`
            border: 1px solid ${colors.BLACK96};
        `}

    & > div:not(:last-child) {
        border-bottom: 1px solid ${colors.BLACK96};
    }
    & > div:not(:first-child) {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

interface Props {
    children: React.ReactNode;
    borderless?: boolean;
    header?: React.ReactNode;
}

const Section = ({ borderless, children, header }: Props) => {
    return (
        <>
            {header && <SectionHeader>{header}</SectionHeader>}
            <SectionWrapper borderless={borderless}>{children}</SectionWrapper>
        </>
    );
};

export default Section;
