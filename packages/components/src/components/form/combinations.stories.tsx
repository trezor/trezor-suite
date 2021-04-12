import React from 'react';
import styled from 'styled-components';
import { Input, SelectBar } from '../../index';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    display: flex;
    height: 34px;
    border-top: 1px solid gray;
    border-bottom: 1px solid gray;
`;

storiesOf('Form', module).add(
    'Combinations',
    () => (
        <Wrapper>
            <SelectBar
                label="Fee"
                selectedOption="ETH"
                options={[
                    { label: 'ETH', value: 'ETH' },
                    { label: 'XRP', value: 'XRP' },
                    { label: 'BCT', value: 'BCT' },
                    { label: 'UAN', value: 'UAN' },
                ]}
            />
            <Input noTopLabel variant="small" />
        </Wrapper>
    ),
    {
        options: {
            showPanel: true,
        },
    }
);
