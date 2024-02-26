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
    gap: 20px;
`;

export default {
    title: 'Misc/Box',
} as Meta;

export const Box: StoryObj = {
    render: () => (
        <>
            <Wrapper>
                <BoxComponent>
                    <Text>No state</Text>
                </BoxComponent>
                <BoxComponent variant="primary">
                    <Text>Success</Text>
                </BoxComponent>
                <BoxComponent variant="destructive">
                    <Text>Error</Text>
                </BoxComponent>
                <BoxComponent variant="warning">
                    <Text>Warning</Text>
                </BoxComponent>
                <BoxComponent variant="info">
                    <Text>Info</Text>
                </BoxComponent>
            </Wrapper>
        </>
    ),
};
