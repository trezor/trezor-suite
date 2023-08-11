import React from 'react';
import { useArgs } from '@storybook/client-api';
import styled from 'styled-components';

import { RadioButton } from './RadioButton';
import { H2 } from '../../typography/Heading/Heading';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    & > * {
        padding: 10px;
    }
`;

export default {
    title: 'Form/RadioButton',
    argTypes: {
        option: {
            control: {
                options: { '1': 'option1', '2': 'option2', '3': 'option3' },
                type: 'radio',
            },
        },
    },
    args: { option: 'option1' },
};

export const Basic = () => {
    const [{ option }, updateArgs] = useArgs();
    const setOption = (option: string) => updateArgs({ option });

    return (
        <Wrapper>
            <RadioButton onClick={() => setOption('option1')} isChecked={option === 'option1'}>
                <div>
                    <H2>Some heading</H2>
                    First option (example of custom content)
                </div>
            </RadioButton>
            <RadioButton onClick={() => setOption('option2')} isChecked={option === 'option2'}>
                Second option
            </RadioButton>
            <RadioButton onClick={() => setOption('option3')} isChecked={option === 'option3'}>
                Third option
            </RadioButton>
        </Wrapper>
    );
};
