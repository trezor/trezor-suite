import { Meta, StoryObj } from '@storybook/react';
import { SkeletonSpread as SkeletonSpreadComponent, SkeletonSpreadProps } from './SkeletonSpread';
import { SkeletonCircle } from './SkeletonCircle';
import styled from 'styled-components';
import { ElevationContext } from '../ElevationContext/ElevationContext';

const Container = styled.div`
    width: 600px;
`;

export default {
    title: 'Skeletons/SkeletonSpread',
    component: SkeletonSpreadComponent,
} as Meta;

export const SkeletonSpread: StoryObj<SkeletonSpreadProps> = {
    render: args => (
        <Container>
            <ElevationContext baseElevation={1}>
                <SkeletonSpreadComponent {...args}>
                    <SkeletonCircle size={50} />
                    <SkeletonCircle size={50} />
                    <SkeletonCircle size={50} />
                </SkeletonSpreadComponent>
            </ElevationContext>
        </Container>
    ),
    args: {
        spaceAround: false,
    },
};
