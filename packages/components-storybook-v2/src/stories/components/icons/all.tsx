import React from 'react';
import styled from 'styled-components';
import { Icon, variables, colors, types } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 20px;
    display: flex;
    flex-wrap: wrap;
`;

const Col = styled.div`
    flex: 1;
`;

const IconWrapper = styled.div`
    display: inline-block;
    margin: 10px 0;
    text-align: center;
    min-width: 110px;
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
        options: {
            showPanel: false,
        },
    }
);
