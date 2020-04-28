import React from 'react';
import { H2, P, Modal } from '../../index';
import { storiesOf } from '@storybook/react';
import { text, boolean } from '@storybook/addon-knobs';

storiesOf('Modals', module).add(
    'Default',
    () => {
        const heading = text('heading', 'Ahoj kamaráde!');
        const description = text('description', 'Description');
        const children = text(
            'children',
            'Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus.'
        );
        const cancelable = boolean('cancelable', true);
        const useFixedWidth = boolean('useFixedWidth', false);
        const useFixedHeight = boolean('useFixedHeight', false);

        // const iconOptions: any = {
        //     None: null,
        // };
        // variables.ICONS.forEach((icon: string) => {
        //     iconOptions[icon] = icon;
        // });

        // const icon = select('Icon', iconOptions, 'ARROW_DOWN');

        return (
            <Modal
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
);
