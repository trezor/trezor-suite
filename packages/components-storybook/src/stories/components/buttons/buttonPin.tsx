import React from 'react';
import { ButtonPin } from '@trezor/components';
import { storiesOf } from '@storybook/react';
import { infoOptions } from '../../../support/info';

storiesOf('Buttons', module).add('Pin Button', () => <ButtonPin onClick={() => {}} />, {
    info: {
        ...infoOptions,
        text: `
        ~~~js
        import { ButtonPin } from 'trezor-ui-components';
        ~~~
        `,
    },
});
