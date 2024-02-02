import { Meta, StoryObj } from '@storybook/react';
import {
    GradientOverlay as GradientOverlayComponent,
    GradientOverlayProps,
} from './GradientOverlay';
import styled from 'styled-components';
import { Card } from '../Card/Card';
import { ElevationContext } from '../ElevationContext/ElevationContext';

const TestContainer = styled.div`
    position: relative;
    width: 300px;
    margin: 10px 0;
`;

export default {
    title: 'Misc/GradientOverlay',
    component: GradientOverlayComponent,
    decorators: [
        (Story: React.FC) => (
            <ElevationContext baseElevation={0}>
                <Card>
                    <TestContainer>
                        OpenStreetMap (OSM) is a free, open geographic database updated and
                        maintained by a community of volunteers via open collaboration. Contributors
                        collect data from surveys, trace from aerial imagery and also import from
                        other freely licensed geodata sources.
                        <Story />
                    </TestContainer>
                    <Card>
                        <TestContainer>
                            OpenStreetMap (OSM) is a free, open geographic database updated and
                            maintained by a community of volunteers via open collaboration.
                            Contributors collect data from surveys, trace from aerial imagery and
                            also import from other freely licensed geodata sources.
                            <Story />
                        </TestContainer>
                    </Card>
                </Card>
            </ElevationContext>
        ),
    ],
} as Meta;

export const GradientOverlay: StoryObj<GradientOverlayProps> = {
    args: {
        hiddenFrom: '50%',
    },
};
