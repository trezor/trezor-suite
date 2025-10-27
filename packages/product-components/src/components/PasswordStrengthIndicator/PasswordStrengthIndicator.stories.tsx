import { Meta, StoryObj } from '@storybook/react';

import {
    PasswordStrengthIndicator as PasswordStrengthIndicatorComponent,
    PasswordStrengthIndicatorProps,
} from './PasswordStrengthIndicator';

const meta: Meta<typeof PasswordStrengthIndicatorComponent> = {
    title: 'PasswordStrengthIndicator',
    component: PasswordStrengthIndicatorComponent,
};
export default meta;

export const PasswordStrengthIndicator: StoryObj<PasswordStrengthIndicatorProps> = {
    render: props => <PasswordStrengthIndicatorComponent {...props} />,
    args: {
        password: 'password',
    },
};
