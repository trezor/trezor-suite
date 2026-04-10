import { type Meta, type StoryObj } from '@storybook/react';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { illustrations } from '@suite-common/illustrations/src/illustrations';

import {
    Illustration as IllustrationComponent,
    allowedIllustrationFrameProps,
} from './Illustration';
import { illustrationIntents } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof IllustrationComponent> = {
    title: 'Illustrations',
    component: IllustrationComponent,
};
export default meta;

export const Illustration: StoryObj<typeof IllustrationComponent> = {
    args: {
        name: 'disconnectTrezor',
        intent: 'brand',
        width: 224,
        ...getFramePropsStory(allowedIllustrationFrameProps).args,
    },
    argTypes: {
        name: {
            options: Object.keys(illustrations),
            control: {
                type: 'select',
            },
        },
        intent: {
            options: illustrationIntents,
            control: {
                type: 'select',
            },
        },
        width: {
            control: {
                type: 'number',
            },
        },
        ...getFramePropsStory(allowedIllustrationFrameProps).argTypes,
    },
};
