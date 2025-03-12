import { Meta, StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { Text as TextComponent, allowedTextFrameProps, allowedTextTextProps } from './Text';
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

export const Text: StoryObj<typeof TextComponent> = {
    render: ({ variant, color, ...rest }) => (
        <Wrapper>
            <ColoredBlock>
                <TextComponent {...rest}>
                    This is just a plain text with inherited color from its parent
                </TextComponent>
            </ColoredBlock>
            <Block>
                <TextComponent variant="default" {...rest}>
                    This is <strong>default</strong> variant
                </TextComponent>
                <TextComponent variant="primary" {...rest}>
                    This is <strong>primary</strong> variant
                </TextComponent>
                <TextComponent variant="info" {...rest}>
                    This is <TextComponent typographyStyle="highlight">info</TextComponent> variant
                </TextComponent>
                <TextComponent variant="warning" {...rest}>
                    This is <strong>warning</strong> variant
                </TextComponent>
                <TextComponent variant="destructive" {...rest}>
                    This is <strong>destructive</strong> variant
                </TextComponent>
            </Block>
            <Block>
                <TextComponent color="#9be887" {...rest}>
                    This is <strong>custom</strong> color variant
                </TextComponent>
            </Block>
            <Block>
                <TextComponent variant="info" typographyStyle="titleMedium" {...rest}>
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
