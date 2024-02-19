import { Meta, StoryObj } from '@storybook/react';
import { DialogModal as ModalComponent, Button, DialogModalProps } from '../../../index';

const Buttons = () => (
    <>
        <Button variant="secondary" size="small">
            Yes
        </Button>

        <Button variant="tertiary" size="small">
            Nope
        </Button>
    </>
);

export default {
    title: 'Modals/DialogModal',
    component: ModalComponent,
} as Meta;

export const DialogModal: StoryObj<DialogModalProps> = {
    args: {
        bodyHeading: 'Modal heading',
        text: 'Modal text',
        icon: 'caretCircleDown',
        bottomBarComponents: <Buttons />,
        onCancel: () => console.log('close'),
    },
    argTypes: {
        text: {
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
        'data-test-id': {
            control: 'none',
        },
    },
};
