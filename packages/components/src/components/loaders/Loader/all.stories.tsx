import React from 'react';
import styled from 'styled-components';
import { H1, Loader, colors } from '../../../index';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';

const Section = styled.div`
    display: block;
    padding: 2em;
`;

const SectionDark = styled(Section)`
    background: ${colors.BG_LIGHT_GREY};
`;

storiesOf('Loaders', module).add(
    'All',
    () => (
        <>
            <StoryColumn minWidth={520}>
                <H1>Loader</H1>
                <Section>
                    <Loader size={100} strokeWidth={2} data-test="loader-default" />
                </Section>

                <H1>Loader on dark background</H1>
                <SectionDark>
                    <Loader size={100} strokeWidth={2} data-test="loader-on-dark-background" />
                </SectionDark>

                <H1>Small loader</H1>
                <Section>
                    <Loader size={20} strokeWidth={1} data-test="loader-small" />
                </Section>
            </StoryColumn>
        </>
    ),
    {
        options: {
            showPanel: false,
        },
    }
);
