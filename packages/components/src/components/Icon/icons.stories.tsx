import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { IconName, icons, Icon, IconProps, allowedIconFrameProps, iconVariants } from './Icon';
import { getFramePropsStory } from '../../utils/frameProps';

const Wrapper = styled.div`
    display: grid;
    width: 100%;
    grid-gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const IconWrapper = styled.div`
    display: flex;
    min-height: 100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &:hover {
        border: 1px dashed #f2ae7b;
    }
`;

const IconText = styled.div`
    padding-bottom: 10px;
    color: ${({ theme }) => theme.textSubdued};
`;

const meta: Meta = {
    title: 'Icons',
} as Meta;
export default meta;

export const AllIcons: StoryObj<IconProps> = {
    render: (props: IconProps) => (
        <Wrapper>
            {Object.keys(icons).map(iconKey => {
                return (
                    <IconWrapper key={iconKey}>
                        <IconText>{iconKey}</IconText>
                        <Icon {...props} name={iconKey as IconName} />
                    </IconWrapper>
                );
            })}
        </Wrapper>
    ),
    args: {
        color: undefined,
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        variant: {
            options: iconVariants,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
