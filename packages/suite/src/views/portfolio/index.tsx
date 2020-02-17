import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import SuiteLayout from '@suite-components/SuiteLayout/Container';

const Placeholder = styled.div`
    display: flex;
    font-weight: bold;
    align-items: center;
    font-size: 2rem;
    justify-content: center;
    flex: 1;
    flex-direction: column;
`;

const Portfolio = () => {
    return (
        <SuiteLayout>
            <Placeholder>Portfolio</Placeholder>
        </SuiteLayout>
    );
};

export default connect()(Portfolio);
