import { IntlProvider } from 'react-intl';
import {
    PassphraseTypeCard as PassphraseTypeCardComponent,
    PassphraseTypeCardProps,
} from './PassphraseTypeCard';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
    title: 'PassphraseTypeCard',
    decorators: [
        (Story: React.FC) => (
            <IntlProvider locale="en">
                <Story />
            </IntlProvider>
        ),
    ],
    component: PassphraseTypeCardComponent,
} as Meta;
export default meta;

export const Standard: StoryObj<PassphraseTypeCardProps> = {
    args: {
        title: 'My Trezor',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ornare quam in justo auctor, in malesuada quam rhoncus. Phasellus sem eros, volutpat laoreet posuere non, feugiat et augue. ',
        submitLabel: 'Yes please',
        offerPassphraseOnDevice: true,
        singleColModal: true,
        onSubmit: () => null,
        type: 'standard',
    },
    argTypes: {
        type: {
            options: ['standard', 'hidden'],
            control: {
                type: 'select',
            },
        },
    },
};

export const Hidden: StoryObj<PassphraseTypeCardProps> = {
    args: {
        submitLabel: 'Yes please',
        offerPassphraseOnDevice: false,
        singleColModal: true,
        onSubmit: () => null,
        type: 'hidden',
        deviceBackup: 'Bip39',
    },
    argTypes: {
        type: {
            options: ['standard', 'hidden'],
            control: {
                type: 'select',
            },
        },
    },
};
