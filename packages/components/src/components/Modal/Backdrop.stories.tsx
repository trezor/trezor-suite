import { ThemeProvider } from 'styled-components';
import { StoryObj } from '@storybook/react';
import { ConfirmOnDevice, Modal, Backdrop as BackdropComponent, ModalProps } from '../../index';
import { DeviceModelInternal } from '@trezor/connect';
import { intermediaryTheme } from '../../config/colors';

export default {
    title: 'Misc/Modals',
    parameters: {
        noWrapper: true,
    },
};

export const Backdrop: StoryObj<ModalProps & { theme: string }> = {
    render: args => (
        <ThemeProvider
            theme={args.theme === 'dark' ? intermediaryTheme.dark : intermediaryTheme.light}
        >
            <BackdropComponent>
                <Modal
                    modalPrompt={
                        <ConfirmOnDevice
                            successText="confirmed"
                            title="Confirm on trezor"
                            deviceModelInternal={DeviceModelInternal.T2T1}
                            steps={3}
                            activeStep={2}
                        />
                    }
                    data-test="modal"
                    heading={args.heading}
                    description={args.description}
                    isCancelable={args.isCancelable}
                >
                    {args.children}
                </Modal>
            </BackdropComponent>
        </ThemeProvider>
    ),
    args: {
        heading: 'This is a heading',
        description: 'This is a description',
        children:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget aliquam aliquam, diam nisl aliquam nisl, vitae aliquam nisl nisl nec nisl.',
        isCancelable: true,
    },
    argTypes: {
        isCancelable: {
            type: 'boolean',
        },
        theme: {
            control: 'radio',
            options: ['light', 'dark'],
        },
    },
};
