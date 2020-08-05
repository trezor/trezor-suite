import React from 'react';
import styled from 'styled-components';
import { SelectBar } from './index';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';

storiesOf('Form', module).add(
    'Select Bar',
    () => {
        const options = [
            { label: 'low', value: 'low' },
            { label: 'medium', value: 'medium' },
            { label: 'high', value: 'high' },
            { label: 'custom', value: 'custom' },
        ];

        return <SelectBar label="fee" selectedOption="low" options={options} />;
    },
    {
        options: {
            showPanel: false,
        },
    }
);
