import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import SectionHeader from './SectionHeader';

const SectionWrapper = styled(Card)`
    flex-direction: column;
    flex: 1;
`;

interface Props {
    children: React.ReactNode;
    header?: React.ReactNode;
}

const Section = ({ children, header }: Props) => {
    return (
        <>
            {header && <SectionHeader>{header}</SectionHeader>}
            <>
                <Card>
                    <SectionWrapper>{children}</SectionWrapper>
                </Card>
            </>
        </>
    );
};

export default Section;
