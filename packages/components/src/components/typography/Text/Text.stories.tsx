import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { allowedTextFrameProps, allowedTextTextProps, Text as TextComponent } from './Text';
import { getFramePropsStory } from '../../../utils/frameProps';
import { getTextPropsStory } from '../utils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Block = styled.div`
    display: flex;
    flex-direction: column;
`;
const ColoredBlock = styled(Block)`
    color: salmon;
`;

const meta: Meta = {
    title: 'Typography',
} as Meta;
export default meta;

export const Text: StoryObj = {
    render: props => (
        <Wrapper>
            <ColoredBlock>
                <TextComponent {...props}>
                    This is just a plain text with inherited color from its parent
                </TextComponent>
            </ColoredBlock>
            <Block>
                <TextComponent variant="default" {...props}>
                    This is <strong>default</strong> variant
                </TextComponent>
                <TextComponent variant="primary" {...props}>
                    This is <strong>primary</strong> variant
                </TextComponent>
                <TextComponent variant="info" {...props}>
                    This is <TextComponent typographyStyle="highlight">info</TextComponent> variant
                </TextComponent>
                <TextComponent variant="warning" {...props}>
                    This is <strong>warning</strong> variant
                </TextComponent>
                <TextComponent variant="destructive" {...props}>
                    This is <strong>destructive</strong> variant
                </TextComponent>
            </Block>
            <Block>
                <TextComponent color="#9be887" {...props}>
                    This is <strong>custom</strong> color variant
                </TextComponent>
            </Block>
            <Block>
                <TextComponent variant="info" typographyStyle="titleMedium" {...props}>
                    This is just a plain Medium Title
                </TextComponent>
            </Block>
        </Wrapper>
    ),
    args: {
        ...getTextPropsStory(allowedTextTextProps).args,
        ...getFramePropsStory(allowedTextFrameProps).args,
    },
    argTypes: {
        ...getTextPropsStory(allowedTextTextProps).argTypes,
        ...getFramePropsStory(allowedTextFrameProps).argTypes,
    },
};
