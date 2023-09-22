import styled from 'styled-components';
import { StoryObj } from '@storybook/react';
import { H1, H2, H3, HeadingProps } from '../../../index';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

export default {
    title: 'Typography/Heading',
};

export const Heading: StoryObj<HeadingProps> = {
    render: args => (
        <Wrapper>
            <H1 textAlign={args.textAlign} noMargin={args.noMargin} fontWeight={args.fontWeight}>
                This is heading 1
            </H1>
            <H2 textAlign={args.textAlign} noMargin={args.noMargin} fontWeight={args.fontWeight}>
                This is heading 2
            </H2>
            <H3 textAlign={args.textAlign} noMargin={args.noMargin} fontWeight={args.fontWeight}>
                This is heading 3
            </H3>
        </Wrapper>
    ),
    argTypes: {
        textAlign: {
            control: 'radio',
            options: ['left', 'center', 'right'],
        },
        noMargin: {
            type: 'boolean',
        },
        fontWeight: {
            type: 'number',
        },
    },
};
