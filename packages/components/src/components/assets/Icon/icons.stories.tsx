import styled from 'styled-components';
import { Meta } from '@storybook/react';
import { Icon, variables, IconType } from '../../../index';

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

export default {
    title: 'Assets/Icons/All',
} as Meta;

export const All = () => (
    <Wrapper>
        {variables.ICONS.map((icon: IconType) => (
            <IconWrapper key={icon}>
                <IconText>{icon}</IconText>
                <Icon icon={icon} data-test-id={`icon-${icon.toLowerCase().replace('_', '-')}`} />
            </IconWrapper>
        ))}
    </Wrapper>
);
