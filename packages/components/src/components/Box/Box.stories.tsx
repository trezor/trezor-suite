import { Meta, StoryObj } from '@storybook/react';

import { borders } from '@trezor/theme';

import { Box as BoxComponent, allowedBoxFrameProps } from './Box';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Box',
    component: BoxComponent,
} as Meta;
export default meta;

export const Box: StoryObj<typeof BoxComponent> = {
    render: props => (
        <BoxComponent {...props}>
            <p>
                Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem
                aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse.
                Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa
                delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda
                aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos.
            </p>
        </BoxComponent>
    ),
    args: {
        ...getFramePropsStory(allowedBoxFrameProps).args,
        width: '300px',
        height: '300px',
    },
    argTypes: {
        hasBackground: {
            control: 'boolean',
        },
        borderRadius: {
            control: 'select',
            options: ['undefined', ...Object.values(borders.radii)],
        },
        borderWidth: {
            control: 'select',
            options: ['undefined', ...Object.values(borders.widths)],
        },
        ...getFramePropsStory(allowedBoxFrameProps).argTypes,
    },
};
