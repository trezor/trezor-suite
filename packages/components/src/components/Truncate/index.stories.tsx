import React from 'react';
import styled from 'styled-components';
import { Truncate } from './index';
import { storiesOf } from '@storybook/react';
import { number } from '@storybook/addon-knobs';

const Holder = styled.div`
    display: flex;
    justify-content: center;
    width: 300px;
    padding: 100px 0px;
`;

storiesOf('Truncate', module).add('Truncate', () => {
    const lines: any = number('Lines', 1);

    const longText =
        'This is a very very very very very very very very very very very very very very very very very very very very very very long text';

    const shortText = 'This is a shor text text';

    return (
        <>
            <Holder>
                <Truncate lines={lines}>{shortText}</Truncate>
            </Holder>
            <Holder>
                <Truncate lines={lines}>{longText}</Truncate>
            </Holder>
        </>
    );
});
