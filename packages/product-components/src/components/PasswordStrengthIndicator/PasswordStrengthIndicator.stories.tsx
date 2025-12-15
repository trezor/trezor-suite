import type { Meta, StoryObj } from '@storybook/react';

import type { PasswordStrengthIndicatorProps } from './PasswordStrengthIndicator';
import { PasswordStrengthIndicator as PasswordStrengthIndicatorComponent } from './PasswordStrengthIndicator';

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
