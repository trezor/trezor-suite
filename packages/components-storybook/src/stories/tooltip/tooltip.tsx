import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
import { storiesOf } from '@storybook/react';
import { select, number, text, boolean } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/info';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

Center.displayName = 'CenterWrapper';

storiesOf('Tooltip', module).add(
    'Tooltip',
    () => {
        const placement: any = select(
            'Placement',
            {
                Top: 'top',
                Bottom: 'bottom',
                Left: 'left',
                Right: 'right',
            },
            'bottom'
        );

        return (
            <Center>
                <Tooltip
                    maxWidth={number('Max width', 280)}
                    placement={placement}
                    content={text('Content', 'Passphrase is an optional feature.')}
                >
                    <span>Text with tooltip</span>
                </Tooltip>
            </Center>
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
        ~~~js
        import { Tooltip } from 'trezor-ui-components';
        ~~~
        *<Tooltip> is a wrapper around [Tippy.js for React](https://github.com/atomiks/tippy.js-react) component. See the [official documentation](https://github.com/atomiks/tippy.js-react) for more information about its props and usage.*
        `,
        },
    }
);
