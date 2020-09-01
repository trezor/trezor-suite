import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { ConfirmOnDevice, Modal } from '../../index';
import { text, boolean } from '@storybook/addon-knobs';

const Wrapper = styled.div`
    background: black;
    height: 100%;
    width: 100%;
`;

storiesOf('Modals', module)
    .add(
        'Default',
        () => {
            const heading = text('heading', 'Ahoj kamaráde!');
            const description = text('description', 'Description');
            const children = text(
                'children',
                'Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus.'
            );
            const cancelable = boolean('cancelable', true);
            const bottomBar = boolean('bottomBar', false);
            const headerWithBorder = boolean('headerWithBorder', true);
            const useFixedWidth = boolean('useFixedWidth', false);
            const useFixedHeight = boolean('useFixedHeight', false);

            return (
                <Wrapper>
                    <Modal
                        data-test="modal"
                        heading={heading === '' ? undefined : heading}
                        description={description === '' ? undefined : description}
                        cancelable={cancelable}
                        bottomBar={bottomBar}
                        headerWithBorder={headerWithBorder}
                        useFixedWidth={useFixedWidth}
                        useFixedHeight={useFixedHeight}
                    >
                        {children}
                    </Modal>
                </Wrapper>
            );
        },
        {
            info: {
                text: `
            ~~~js
            import { Modal } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add('with confirm header', () => {
        const heading = text('heading', 'Ahoj kamaráde!');
        const description = text('description', 'Description');
        const children = text(
            'children',
            'Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus.'
        );
        const cancelable = boolean('cancelable', true);
        const useFixedWidth = boolean('useFixedWidth', false);
        const useFixedHeight = boolean('useFixedHeight', false);

        return (
            <Modal
                header={
                    <ConfirmOnDevice
                        successText="confirmed"
                        title="Confirm on trezor"
                        trezorModel={2}
                        steps={3}
                        activeStep={2}
                    />
                }
                data-test="modal"
                heading={heading === '' ? undefined : heading}
                description={description === '' ? undefined : description}
                cancelable={cancelable}
                useFixedWidth={useFixedWidth}
                useFixedHeight={useFixedHeight}
            >
                {children}
            </Modal>
        );
    });
