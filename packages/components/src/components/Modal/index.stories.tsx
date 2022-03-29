import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { storiesOf } from '@storybook/react';
import { ConfirmOnDevice, Modal, Backdrop, Button, THEME } from '../../index';
import { text, boolean, number, select } from '@storybook/addon-knobs';

const StyledButton = styled(Button)<{ flex: boolean }>`
    ${({ flex }) => flex && 'flex: 1;'}
`;

const Buttons = ({
    count,
    fullWidth,
    flex,
    prefix,
}: {
    count: number;
    fullWidth: boolean;
    flex: boolean;
    prefix: string;
}) => (
    <>
        {new Array(count).fill(undefined).map((_a, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <StyledButton key={i} fullWidth={fullWidth} flex={flex} variant="primary">
                {prefix} {i}
            </StyledButton>
        ))}
    </>
);

storiesOf('Modals', module)
    .add('Default', () => {
        const heading = text('Title', 'Ahoj kamaráde!', 'Header bar');
        const cancelable = boolean('cancelable', true, 'Header bar');
        const useProgress = boolean('useProgress', false, 'Header bar');
        const totalProgressBarSteps = number('totalProgressBarSteps', 0, undefined, 'Header bar');
        const currentProgressBarStep = number('currentProgressBarStep', 0, undefined, 'Header bar');

        const description = text('Description', 'Description', 'Body');
        const children = text(
            'Content',
            'Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus.',
            'Body',
        );

        const bottomBarButtonCount = number('Button count', 0, undefined, 'Bottom bar');
        const bottomBarButtonPrefix = text('Button text', 'Button', 'Bottom bar');
        const bottomBarButtonFullWidth = boolean('Full-width buttons', false, 'Bottom bar');
        const bottomBarButtonFlex = boolean('Flex buttons', false, 'Bottom bar');

        return (
            <>
                <Modal
                    data-test="modal"
                    heading={heading === '' ? undefined : heading}
                    description={description === '' ? undefined : description}
                    cancelable={cancelable}
                    bottomBar={
                        bottomBarButtonCount ? (
                            <Buttons
                                prefix={bottomBarButtonPrefix}
                                count={bottomBarButtonCount}
                                fullWidth={bottomBarButtonFullWidth}
                                flex={bottomBarButtonFlex}
                            />
                        ) : undefined
                    }
                    totalProgressBarSteps={useProgress ? totalProgressBarSteps : undefined}
                    currentProgressBarStep={useProgress ? currentProgressBarStep : undefined}
                >
                    {children}
                </Modal>
            </>
        );
    })
    .add(
        'With backdrop and header',
        () => {
            const heading = text('heading', 'Ahoj kamaráde!');
            const description = text('description', 'Description');
            const children = text(
                'children',
                'Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus.',
            );
            const cancelable = boolean('cancelable', true);
            const animated = boolean('animated', false);
            const theme = select('Theme', ['light', 'dark'], 'light');

            return (
                <ThemeProvider theme={theme === 'dark' ? THEME.dark : THEME.light}>
                    <Backdrop>
                        <Modal
                            header={
                                <ConfirmOnDevice
                                    successText="confirmed"
                                    title="Confirm on trezor"
                                    trezorModel={2}
                                    steps={3}
                                    activeStep={2}
                                    animated={animated}
                                />
                            }
                            data-test="modal"
                            heading={heading === '' ? undefined : heading}
                            description={description === '' ? undefined : description}
                            cancelable={cancelable}
                        >
                            {children}
                        </Modal>
                    </Backdrop>
                </ThemeProvider>
            );
        },
        { noWrapper: true },
    );
