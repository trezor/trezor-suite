import { IntlProvider } from 'react-intl';

import { Meta, StoryObj } from '@storybook/react';

import { FractionButton as FractionButtonComponent, FractionButtonProps } from './FractionButton';
import { buttonVariants } from '../../buttons/buttonStyleUtils';

const meta: Meta<typeof FractionButtonComponent> = {
    title: 'Form',
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
        variant: 'primary',
        isDisabled: false,
        onClick: () => console.log('Rewards'),
    },
    argTypes: {
        variant: { control: 'radio', options: buttonVariants },
        isDisabled: { control: 'boolean' },
    },
};
