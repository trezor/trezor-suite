import React from 'react';
import styled from 'styled-components';
import { Box } from './Box';
import { FONT_WEIGHT } from '../../config/variables';

const Text = styled.div`
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
`;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const StyledRow = styled(Box)`
    margin: 10px 0;
`;

export default {
    title: 'Misc/Box',
};

export const Basic = {
    render: () => (
        <>
            <Wrapper>
                <StyledRow>
                    <Text>No state</Text>
                </StyledRow>
                <StyledRow state="success">
                    <Text>Success</Text>
                </StyledRow>
                <StyledRow state="error">
                    <Text>Error</Text>
                </StyledRow>
                <StyledRow state="warning">
                    <Text>Warning</Text>
                </StyledRow>
            </Wrapper>
        </>
    ),
};
