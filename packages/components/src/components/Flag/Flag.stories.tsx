import { type Meta, type StoryObj } from '@storybook/react';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { FLAGS, flagSizes } from '@suite-common/flags';

import { Flag as FlagComponent } from './Flag';

const meta: Meta<typeof FlagComponent> = {
    title: 'Flags',
    component: FlagComponent,
};
export default meta;

export const Flag: StoryObj<typeof meta> = {
    args: {
        country: 'CZ',
        size: 48,
    },
    argTypes: {
        country: {
            options: Object.keys(FLAGS),
            control: { type: 'select' },
        },
        size: {
            options: flagSizes,
            control: { type: 'select' },
        },
    },
};
