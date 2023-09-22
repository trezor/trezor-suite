import styled from 'styled-components';
import { StoryObj } from '@storybook/react';
import { Modal, ModalProps, Button } from '../../index';

const StyledButton = styled(Button)<{ flex: boolean }>`
    ${({ flex }) => flex && 'flex: 1;'}
`;

interface ButtonsProps {
    count: number;
    isFullWidth: boolean;
    flex: boolean;
    prefix: string;
}

const Buttons = ({ count, isFullWidth, flex, prefix }: ButtonsProps) => (
    <>
        {new Array(count).fill(undefined).map((_a, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <StyledButton key={i} isFullWidth={isFullWidth} flex={flex} variant="primary">
                {prefix} {i}
            </StyledButton>
        ))}
    </>
);

export default {
    title: 'Misc/Modals/Default',
    component: Modal,
};

export const Default: StoryObj<ModalProps & ButtonsProps> = {
    render: args => (
        <Modal
            heading={args.heading}
            description={args.description}
            isCancelable={args.isCancelable}
            bottomBar={
                args.count ? (
                    <Buttons
                        prefix={args.prefix}
                        count={args.count}
                        isFullWidth={args.isFullWidth}
                        flex={args.flex}
                    />
                ) : undefined
            }
            totalProgressBarSteps={args.totalProgressBarSteps}
            currentProgressBarStep={args.currentProgressBarStep}
        >
            {args.children}
        </Modal>
    ),
    args: {
        heading: 'This is a heading',
        description: 'This is a description',
        children:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget aliquam aliquam, diam nisl aliquam nisl, vitae aliquam nisl nisl nec nisl.',
        isCancelable: true,
        count: 0,
        prefix: 'Button',
        isFullWidth: false,
        flex: false,
        totalProgressBarSteps: 0,
        currentProgressBarStep: 0,
    },
    argTypes: {
        isCancelable: {
            type: 'boolean',
        },
        count: {
            type: 'number',
        },
        isFullWidth: {
            type: 'boolean',
        },
        flex: {
            type: 'boolean',
        },
        totalProgressBarSteps: {
            type: 'number',
        },
        currentProgressBarStep: {
            type: 'number',
        },
    },
};
