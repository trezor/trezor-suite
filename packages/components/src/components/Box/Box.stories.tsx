import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { Box as BoxComponent } from './Box';
import { FONT_WEIGHT } from '../../config/variables';

const Text = styled.div`
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
`;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const StyledRow = styled(BoxComponent)`
    margin: 10px 0;
`;

export default {
    title: 'Misc/Box',
} as Meta;

export const Box: StoryObj = {
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
