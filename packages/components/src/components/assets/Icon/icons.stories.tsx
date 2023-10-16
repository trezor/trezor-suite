import styled from 'styled-components';
import { Icon, variables, IconType } from '../../../index';
import { storiesOf } from '@storybook/react';

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

storiesOf('Assets/Icons', module).add(
    'All',
    () => (
        <Wrapper>
            {variables.ICONS.map((icon: IconType) => (
                <IconWrapper>
                    <IconText>{icon}</IconText>
                    <Icon icon={icon} data-test={`icon-${icon.toLowerCase().replace('_', '-')}`} />
                </IconWrapper>
            ))}
        </Wrapper>
    ),
    {
        options: {
            showPanel: false,
        },
    },
);
