import { Meta, StoryObj } from '@storybook/react';

import { Address as AddressComponent } from './Address';

const meta = {
    title: 'Address',
    component: AddressComponent,
} as Meta;
export default meta;

export const Address: StoryObj = {
    args: {
        value: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        isTruncated: false,
    },
    argTypes: {
        value: {
            control: 'text',
        },
        isTruncated: {
            control: 'boolean',
        },
    },
};
