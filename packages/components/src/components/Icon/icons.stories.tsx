import styled from 'styled-components';
import { Meta } from '@storybook/react';
import { IconName, icons } from './Icon';
import { Icon } from '@suite-common/icons/src/webComponents';

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

export const AllIcons = () => (
    <Wrapper>
        {Object.keys(icons).map(iconKey => {
            return (
                <IconWrapper key={iconKey}>
                    <IconText>{iconKey}</IconText>
                    <Icon name={iconKey as IconName} color="iconDefault" />
                </IconWrapper>
            );
        })}
    </Wrapper>
);
