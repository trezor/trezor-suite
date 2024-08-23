import styled from 'styled-components';
import { Meta } from '@storybook/react';
import { IconLegacy, variables, IconType } from '../../index';

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
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const meta: Meta = {
    title: 'Icons',
} as Meta;
export default meta;

export const LegacyIconsAll = () => (
    <Wrapper>
        {variables.ICONS.map((icon: IconType) => (
            <IconWrapper key={icon}>
                <IconText>{icon}</IconText>
                <IconLegacy
                    icon={icon}
                    data-testid={`icon-${icon.toLowerCase().replace('_', '-')}`}
                />
            </IconWrapper>
        ))}
    </Wrapper>
);
