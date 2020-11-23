import React from 'react';
import styled from 'styled-components';
import { colors, Flag, variables, types } from '../../index';
import { storiesOf } from '@storybook/react';
import randomColor from 'randomcolor';

const color = randomColor({ luminosity: 'light' });

const Wrapper = styled.div`
    display: grid;
    width: 100%;
    grid-gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const FlagWrapper = styled.div`
    display: flex;
    min-height: 100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &:hover {
        border: 1px dashed ${color};
    }
`;

const Text = styled.div`
    padding-bottom: 10px;
`;

storiesOf('Flags', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                {variables.FLAGS.map((country: types.FlagType) => {
                    return (
                        <FlagWrapper key={country}>
                            <Text>{country}</Text>
                            <Flag
                                country={country}
                                data-test={`icon-${country.toLowerCase().replace('_', '-')}`}
                            />
                        </FlagWrapper>
                    );
                })}
            </Wrapper>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
