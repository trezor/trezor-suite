import styled from 'styled-components';
import React from 'react';

const Section = styled.section`
    width: 320px;
    display: inline-block;
    vertical-align: top;
`;

const AsideSection = (props) => (
    <Section>
        {props.children}
    </Section>
);

export default AsideSection;
