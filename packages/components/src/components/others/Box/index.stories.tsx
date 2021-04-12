import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Box } from '../../../index';
import { FONT_WEIGHT } from '../../../config/variables';

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

storiesOf('Others', module).add('Box', () => (
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
));
