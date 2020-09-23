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

const Passwords = () => {
    const { setLayout } = React.useContext(LayoutContext);
    React.useEffect(() => {
        if (setLayout) setLayout('Passwords', undefined);
    }, [setLayout]);

    return (
        <>
            <Placeholder>Passwords</Placeholder>
        </>
    );
};

export default connect()(Passwords);
