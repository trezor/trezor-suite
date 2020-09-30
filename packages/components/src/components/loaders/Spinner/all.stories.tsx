import React from 'react';
import styled from 'styled-components';
import { H1, H2, Spinner } from '../../../index';
import { storiesOf } from '@storybook/react';

const Section = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    margin: 2rem 0 3rem;
`;

storiesOf('Loaders', module).add(
    'All',
    () => {
        return (
            <>
                <H1>Loader</H1>
                <H2>default</H2>
                <Section>
                    <Spinner size={100} data-test="loader-default" />
                </Section>
            </>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
