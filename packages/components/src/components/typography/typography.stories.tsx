import { StoryColumn } from '../../support/Story';
import { H1, H2, P, Link } from '../../index';
import { storiesOf } from '@storybook/react';

storiesOf('Typography/All', module).add(
    'All',
    () => (
        <>
            <StoryColumn>
                <H1 data-test="heading-1">Heading 1</H1>
                <H2 data-test="heading-2">Heading 2</H2>
            </StoryColumn>
            <StoryColumn>
                <P data-test="paragraph-default">
                    size="default" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="small" data-test="paragraph-small">
                    size="small" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="tiny" data-test="paragraph-tiny">
                    size="tiny" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P weight="bold" data-test="paragraph-bold">
                    weight="bold" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P size="small" weight="bold" data-test="paragraph-small-bold">
                    size="small" weight="bold" <br />
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
            </StoryColumn>
        </>
    ),
    {
        options: {
            showPanel: false,
        },
    },
);
