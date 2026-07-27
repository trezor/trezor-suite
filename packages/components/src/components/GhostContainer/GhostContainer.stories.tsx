import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import {
    GhostContainer as GhostContainerComponent,
    type GhostContainerProps,
    allowedGhostContainerFrameProps,
} from './GhostContainer';
import { getFramePropsStory } from '../../utils/frameProps';
import { Text } from '../typography/Text/Text';

const meta: Meta<typeof GhostContainerComponent> = {
    title: 'GhostContainer',
    component: GhostContainerComponent,
};

export default meta;

export const GhostContainer: StoryObj<typeof GhostContainerComponent> = {
    args: {
        isActive: false,
        isDisabled: false,
        ...getFramePropsStory(allowedGhostContainerFrameProps).args,
        padding: 12,
    },
    argTypes: {
        onClick: { action: 'clicked' },
        isActive: { control: 'boolean' },
        isDisabled: { control: 'boolean' },
        ...getFramePropsStory(allowedGhostContainerFrameProps).argTypes,
    },
    render: (props: GhostContainerProps) => (
        <GhostContainerComponent {...props} onClick={action('clicked')}>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                Ghost container content
            </Text>
        </GhostContainerComponent>
    ),
};
