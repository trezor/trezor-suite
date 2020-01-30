import React from 'react';
import styled from 'styled-components';
import { Icon, variables, colors, types } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import randomColor from 'randomcolor';

const color = randomColor({ luminosity: 'light' });

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
        border: 1px dashed ${color};
    }
`;

const IconText = styled.div`
    padding-bottom: 10px;
    color: ${colors.BLACK50};
`;

storiesOf('Icons', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                {variables.ICONS.map((icon: types.IconType) => (
                    <IconWrapper>
                        <IconText>{icon}</IconText>
                        <Icon
                            icon={icon}
                            color={colors.BLACK17}
                            data-test={`icon-${icon.toLowerCase().replace('_', '-')}`}
                        />
                    </IconWrapper>
                ))}
            </Wrapper>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
