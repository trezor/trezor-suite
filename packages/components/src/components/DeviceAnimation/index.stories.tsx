import React from 'react';
import styled from 'styled-components';
import { DeviceAnimation } from '../../index';
import { storiesOf } from '@storybook/react';
import { select, boolean, number } from '@storybook/addon-knobs';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

Center.displayName = 'CenterWrapper';

storiesOf('DeviceAnimation', module).add('DeviceAnimation', () => {
    const type: any = select('Placement', ['CONNECT_TT'], 'CONNECT_TT');
    const loop: any = boolean('Loop', true);
    const size: any = number('Size', 200);

    return (
        <Center>
            <DeviceAnimation type={type} loop={loop} size={size} />
        </Center>
    );
});
