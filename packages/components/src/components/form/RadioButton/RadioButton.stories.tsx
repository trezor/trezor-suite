import React from 'react';
import { useArgs } from '@storybook/client-api';
import styled from 'styled-components';

import { RadioButton as RadioButtonComponent } from './RadioButton';
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
};

export const RadioButton = {
    render: () => {
        // eslint-disable-next-line
        const [{ option }, updateArgs] = useArgs();

        const setOption = (option: string) => updateArgs({ option });

        return (
            <Wrapper>
                <RadioButtonComponent
                    onClick={() => setOption('option1')}
                    isChecked={option === 'option1'}
                >
                    <div>
                        <H2>Some heading</H2>
                        First option (example of custom content)
                    </div>
                </RadioButtonComponent>
                <RadioButtonComponent
                    onClick={() => setOption('option2')}
                    isChecked={option === 'option2'}
                >
                    Second option
                </RadioButtonComponent>
                <RadioButtonComponent
                    onClick={() => setOption('option3')}
                    isChecked={option === 'option3'}
                >
                    Third option
                </RadioButtonComponent>
            </Wrapper>
        );
    },
    args: { option: 'option1' },
};
