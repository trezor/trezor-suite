import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: block;
    text-align: left;
`;

const NoChange = () => {
    return (
        <Wrapper>
            <div>This transaction doesn't contain a change output and cannot be replaced</div>
            {/* <select>
                <option>Add another utxo</option>
            </select> */}
        </Wrapper>
    );
};

export default NoChange;
