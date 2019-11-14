import React from 'react';
import { Button } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { infoOptions } from '../../../support/info';

storiesOf('Buttons', module).add(
    'Button',
    () => {
        return <Button />;
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Button } from 'trezor-ui-components';
            ~~~
            `,
        },
    }
);
