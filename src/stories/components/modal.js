import React from 'react';

import { storiesOf } from '@storybook/react';

import Modal from 'components/Modal';

storiesOf('Modal', module)
    .addWithJSX('Hello world!', () => {
        const modal = {
            content: 'Hello world!',
        };
        return (
            <Modal
                modal={modal}
            />
        );
    });
