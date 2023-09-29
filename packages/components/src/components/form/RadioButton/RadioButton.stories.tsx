import { useArgs } from '@storybook/client-api';
import styled from 'styled-components';

import { RadioButton as RadioButtonComponent, RadioProps } from './RadioButton';
import { H2 } from '../../typography/Heading/Heading';
import { StoryObj } from '@storybook/react';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    & > * {
        padding: 10px;
    }
`;

export default {
    title: 'Form/RadioButton',
    component: RadioButtonComponent,
};

export const RadioButton: StoryObj<RadioProps> = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <RadioButtonComponent {...args} onClick={handleIsChecked} isChecked={isChecked}>
                {args.children}
            </RadioButtonComponent>
        );
    },
    args: { children: 'RadioButton' },
};

export const RadioButtonGroup: StoryObj = {
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
