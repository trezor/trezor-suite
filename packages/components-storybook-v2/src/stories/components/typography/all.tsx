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
                <H1>Heading 1</H1>
                <H2>Heading 2</H2>
                <P>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="small">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="tiny">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P weight="bold">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="small" weight="bold">
                    Lorem ipsum dolor sit amet, <Link>link</Link> consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
