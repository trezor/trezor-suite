import React from 'react';
import styled from 'styled-components';

const Row = styled.div`
    display: flex;
    justify-content: center;
    flex: 1;
    flex-direction: row;
    min-height: 70px;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    width: 232px;
`;

export const Buttons: React.FunctionComponent = props => {
    return (
        <Row>
            <Col>{props.children}</Col>
        </Row>
    );
};
