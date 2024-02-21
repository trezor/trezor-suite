import styled from 'styled-components';
import { Meta, StoryFn } from '@storybook/react';

import { Flag, FlagType } from './Flag';
import { FLAGS } from './flags';

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
        border: 1px dashed #f2ae7b;
    }
`;

const Text = styled.div`
    padding-bottom: 10px;
`;

export default {
    title: 'Assets/Flags',
    parameters: {
        options: {
            showPanel: false,
        },
    },
} as Meta;

export const All: StoryFn = () => {
    const flags = Object.keys(FLAGS) as FlagType[];

    return (
        <Wrapper>
            {flags.map(country => (
                <FlagWrapper key={country}>
                    <Text>{country}</Text>
                    <Flag
                        country={country}
                        data-test-id={`icon-${country.toLowerCase().replace('_', '-')}`}
                    />
                </FlagWrapper>
            ))}
        </Wrapper>
    );
};
