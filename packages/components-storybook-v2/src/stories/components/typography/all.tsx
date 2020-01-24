import React from 'react';
import styled from 'styled-components';
import { H1, H2, P, Link } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

storiesOf('Typography', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <H1 data-test="heading-1">Heading 1</H1>
                <H2 data-test="heading-2">Heading 2</H2>
                <P data-test="paragraph-default">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="small" data-test="paragraph-small">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="tiny" data-test="paragraph-tiny">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P weight="bold" data-test="paragraph-bold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="small" weight="bold" data-test="paragraph-small-bold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P data-test="paragraph-link">
                    Default text with <Link href="/">link</Link>.
                </P>
                <P size="small" data-test="paragraph-link-small">
                    Small text with <Link href="/">link</Link>.
                </P>
                <P size="tiny" data-test="paragraph-link-tiny">
                    Tiny text with <Link href="/">link</Link>.
                </P>
            </Wrapper>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
