import React from 'react';
import styled from 'styled-components';
import { H1, H2, Loader, colors } from '../../../index';
import { storiesOf } from '@storybook/react';

const Section = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    margin: 2rem 0 3rem;
`;

const SectionDark = styled(Section)`
    background: ${colors.BLACK17};
`;

storiesOf('Loaders', module).add(
    'All',
    () => {
        return (
            <>
                <H1>Loader</H1>
                <H2>default</H2>
                <Section>
                    <Loader size={100} strokeWidth={2} text="loading" data-test="loader-default" />
                </Section>

                <H2>small text</H2>
                <Section>
                    <Loader
                        size={100}
                        strokeWidth={2}
                        text="loading"
                        isSmallText
                        data-test="loader-small-text"
                    />
                </Section>

                <H2>transparent route</H2>
                <Section>
                    <Loader
                        size={100}
                        strokeWidth={2}
                        text="loading"
                        transparentRoute
                        data-test="loader-transparent-route"
                    />
                </Section>

                <H2>white text</H2>
                <SectionDark>
                    <Loader
                        size={100}
                        strokeWidth={2}
                        text="loading"
                        isWhiteText
                        data-test="loader-white-text"
                    />
                </SectionDark>

                <H2>white text &amp; transparent route</H2>
                <SectionDark>
                    <Loader
                        size={100}
                        strokeWidth={2}
                        text="loading"
                        isWhiteText
                        transparentRoute
                        data-test="loader-white-text-transparent"
                    />
                </SectionDark>
            </>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
