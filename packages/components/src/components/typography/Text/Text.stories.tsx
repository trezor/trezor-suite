import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { Text as TextComponent } from './Text';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Block = styled.div`
    display: flex;
    flex-direction: column;
`;

const meta: Meta = {
    title: 'Typography/Text',
} as Meta;
export default meta;

export const Text: StoryObj = {
    render: () => (
        <Wrapper>
            <Block>
                <TextComponent>This is just a plain text</TextComponent>
            </Block>
            <Block>
                <TextComponent variant={'primary'}>
                    This is <strong>primary</strong> text
                </TextComponent>
                <TextComponent variant={'info'}>
                    This is <strong>info</strong> text
                </TextComponent>
                <TextComponent variant={'warning'}>
                    This is <strong>warning</strong> text
                </TextComponent>
                <TextComponent variant={'destructive'}>
                    This is <strong>destructive</strong> text
                </TextComponent>
            </Block>
            <Block>
                <TextComponent color={'#9be887'}>
                    This is <strong>custom</strong> color text
                </TextComponent>
            </Block>
            <Block>
                <TextComponent variant={'info'} typographyStyle="titleMedium">
                    This is just a plain Medium Title
                </TextComponent>
            </Block>
        </Wrapper>
    ),
};
