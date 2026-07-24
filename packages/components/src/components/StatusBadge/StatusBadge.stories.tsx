import { type Meta, type StoryObj } from '@storybook/react';

import { StatusBadge as StatusBadgeComponent } from './StatusBadge';
import { dotIntents } from '../Dot/Dot';

const meta: Meta<typeof StatusBadgeComponent> = {
    title: 'StatusBadge',
    component: StatusBadgeComponent,
};
export default meta;

const Placeholder = () => (
    <div
        style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'rgb(120 120 120 / 30%)',
        }}
    />
);

export const StatusBadge: StoryObj<typeof meta> = {
    args: {
        isShown: true,
        intent: 'critical',
        children: <Placeholder />,
    },
    argTypes: {
        isShown: {
            control: 'boolean',
        },
        intent: {
            options: dotIntents,
            control: 'radio',
        },
    },
};
