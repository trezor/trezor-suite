import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Timerange, timerangeGlobalStyles, TimerangeProps } from './index';
import { storiesOf } from '@storybook/react';
import { date } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/storybook';

const GlobalStyle = createGlobalStyle`
    ${timerangeGlobalStyles}
`;

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
    background: #eee;
`;

Center.displayName = 'CenterWrapper';

storiesOf('Timerange', module).add(
    'Timerange',
    () => {
        const startDate = new Date(date('Start date', new Date('September 17 2020')));
        const endDate = new Date(date('End date', new Date('September 26 2020')));

        return (
            <Center>
                <GlobalStyle />
                <Timerange startDate={startDate} endDate={endDate} onChange={() => {}} />
            </Center>
        );
    },
    {
        argTypes: { onChange: { action: 'onChange' } },
        info: {
            ...infoOptions,
            text: `
        ~~~js
        import { Timerange } from 'trezor-ui-components';
        ~~~
        *<Timerange> is based on [react-datepicker](https://github.com/Hacker0x01/react-datepicker/) component.*
        `,
        },
    }
);
