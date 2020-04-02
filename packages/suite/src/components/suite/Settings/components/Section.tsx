import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import SectionHeader from './SectionHeader';

const SectionWrapper = styled.div`
    border-radius: 6px;
    margin-top: 16px;
    text-align: left;

    & > div:not(:last-child) {
        border-bottom: 1px solid ${colors.BLACK96};
    }
    & > div:not(:first-child) {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

interface Props {
    children: React.ReactNode;
    header?: React.ReactNode;
}

const Section = ({ children, header }: Props) => {
    return (
        <>
            {header && <SectionHeader>{header}</SectionHeader>}
            <SectionWrapper>{children}</SectionWrapper>
        </>
    );
};

export default Section;
