import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { LayoutContext } from '@suite-components/SuiteLayout';

const Placeholder = styled.div`
    display: flex;
    font-weight: bold;
    align-items: center;
    font-size: 2rem;
    justify-content: center;
    flex: 1;
    flex-direction: column;
`;

const Exchange = () => {
    const { setLayout } = React.useContext(LayoutContext);
    React.useMemo(() => {
        if (setLayout) setLayout('Exchange', undefined);
    }, [setLayout]);

    return (
        <>
            <Placeholder>Exchange</Placeholder>
        </>
    );
};

export default connect()(Exchange);
