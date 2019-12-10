import React from 'react';
import styled from 'styled-components';
import { Icon, variables, colors, types } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Col = styled.div`
    margin: 1rem 0 2rem;
`;

const Heading = styled.h2``;

const IconWrapper = styled.div`
    display: inline-block;
    margin: 2rem 0 0 0;
    text-align: center;
    width: 20%;
`;

const IconText = styled.div`
    margin-bottom: 0.5rem;
    color: ${colors.BLACK50};
`;

storiesOf('Icons', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <Heading>Icons</Heading>
                <Col>
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
                </Col>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
