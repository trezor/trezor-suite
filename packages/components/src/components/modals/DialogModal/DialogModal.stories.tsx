import { Meta, StoryObj } from '@storybook/react';

import { variables } from '../../../config';
import { Button, DialogModalProps, DialogModal as ModalComponent } from '../../../index';

const Buttons = () => (
    <>
        <Button variant="primary" size="small">
            Yes
        </Button>

        <Button variant="tertiary" size="small">
            Nope
        </Button>
    </>
);

const meta: Meta = {
    title: 'DialogModal',
    component: ModalComponent,
} as Meta;
export default meta;

export const DialogModal: StoryObj<DialogModalProps> = {
    args: {
        bodyHeading: 'Modal heading',
        body: 'Modal text',
        icon: 'caretCircleDown',
        bottomBarComponents: <Buttons />,
        onCancel: () => console.log('close'),
    },
    argTypes: {
        body: {
            control: 'text',
        },
        headerHeading: {
            control: 'text',
        },
        bodyHeading: {
            control: 'text',
        },
        bottomBarComponents: {
            control: 'none',
        },
        className: {
            control: 'none',
        },
        'data-testid': {
            control: 'none',
        },
        icon: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
    },
};
