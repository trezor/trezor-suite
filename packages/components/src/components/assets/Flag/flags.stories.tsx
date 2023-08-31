import styled from 'styled-components';

import { Flag } from './Flag';
import { FLAGS } from './flags';
import { FlagType } from '../../../support/types';

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
};

export const All = () => {
    const flags = Object.keys(FLAGS) as FlagType[];
    return (
        <Wrapper>
            {flags.map(country => (
                <FlagWrapper key={country}>
                    <Text>{country}</Text>
                    <Flag
                        country={country}
                        data-test={`icon-${country.toLowerCase().replace('_', '-')}`}
                    />
                </FlagWrapper>
            ))}
        </Wrapper>
    );
};
