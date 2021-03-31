import React, { useState } from 'react';
import { RadioButton } from '.';
import { storiesOf } from '@storybook/react';
import { text, boolean } from '@storybook/addon-knobs';
import styled from 'styled-components';
import { H2 } from '../../typography/Heading';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    & > * {
        padding: 10px;
    }
`;

const CustomContent = styled.div``;

storiesOf('Form', module).add('Radio Button', () => {
    const [option, setOption] = useState('option1');
    return (
        <Wrapper>
            <RadioButton
                onClick={() => setOption('option1')}
                isChecked={option === 'option1'}
                value="option1"
            >
                <CustomContent>
                    <H2>Some heading</H2>
                    First option (example of custom content)
                </CustomContent>
            </RadioButton>
            <RadioButton
                onClick={() => setOption('option2')}
                isChecked={option === 'option2'}
                value="option2"
            >
                Second option
            </RadioButton>
            <RadioButton
                onClick={() => setOption('option3')}
                isChecked={option === 'option3'}
                value="option3"
            >
                Third option
            </RadioButton>
        </Wrapper>
    );
});
