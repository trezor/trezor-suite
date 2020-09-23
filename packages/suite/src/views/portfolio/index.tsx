import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { LayoutContext } from '@suite-components';

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
    const { setLayout } = React.useContext(LayoutContext);
    React.useEffect(() => {
        if (setLayout) setLayout('Portfolio', undefined);
    }, [setLayout]);

    return (
        <>
            <Placeholder>Portfolio</Placeholder>
        </>
    );
};

export default connect()(Portfolio);
