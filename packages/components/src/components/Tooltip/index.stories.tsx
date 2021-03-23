import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '../../index';
import { storiesOf } from '@storybook/react';
import { select, number, text, boolean } from '@storybook/addon-knobs';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

Center.displayName = 'CenterWrapper';

storiesOf('Tooltip', module).add('Tooltip', () => {
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
                offset={number('Offset (distance)', 10)}
                placement={placement}
                dashed={boolean('Dashed', false)}
                cursor={select('Cursor', ['help', 'inherit', 'default'], 'help')}
                content={text('Content', 'Passphrase is an optional feature.')}
            >
                <span>Text with tooltip</span>
            </Tooltip>
        </Center>
    );
});
