import { IntlProvider } from 'react-intl';

import { type Meta, type StoryObj } from '@storybook/react';

import {
    FractionButton as FractionButtonComponent,
    type FractionButtonProps,
} from './FractionButton';

const meta: Meta<typeof FractionButtonComponent> = {
    title: '✏️ Form',
    decorators: [
        (Story: React.FC) => (
            <IntlProvider locale="en">
                <Story />
            </IntlProvider>
        ),
    ],
    component: FractionButtonComponent,
};
export default meta;

export const FractionButton: StoryObj<FractionButtonProps> = {
    render: args => <FractionButtonComponent {...args} />,
    args: {
        id: 'TR_FRACTION_BUTTONS_REWARDS',
        children: 'Rewards',
        tooltip: 'Tooltip',
        isDisabled: false,
        onClick: () => console.log('Rewards'),
    },
    argTypes: {
        isDisabled: { control: 'boolean' },
    },
};
