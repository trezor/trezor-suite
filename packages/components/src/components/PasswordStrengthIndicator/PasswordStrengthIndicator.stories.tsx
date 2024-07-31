import { Meta, StoryObj } from '@storybook/react';
import {
    PasswordStrengthIndicatorProps,
    PasswordStrengthIndicator as PasswordStrengthIndicatorComponent,
} from './PasswordStrengthIndicator';

const meta: Meta = {
    title: 'Misc/PasswordStrengthIndicator',
    component: PasswordStrengthIndicatorComponent,
} as Meta;
export default meta;

export const PasswordStrengthIndicator: StoryObj<PasswordStrengthIndicatorProps> = {
    render: props => <PasswordStrengthIndicatorComponent {...props} />,
    args: {
        password: 'password',
    },
};
