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
                    default
                    <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P type="titleLarge" data-test="paragraph-titleLarge">
                    type="titleLarge" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P type="titleMedium" data-test="paragraph-titleMedium">
                    type="titleMedium" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P type="titleSmall" data-test="paragraph-titleSmall">
                    type ="titleSmall" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P type="highlight" data-test="paragraph-highlight">
                    type="highlight" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P type="callout" data-test="paragraph-callout">
                    type="callout" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P type="hint" data-test="paragraph-hint">
                    type="hint" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>
                <P type="label" data-test="paragraph-label">
                    type="label" <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis
                    lectus eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed
                    suscipit interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus
                    eu porta vel, feugiat vel mi.
                </P>

                <P data-test="paragraph-link">
                    Default text with <Link href="/">link</Link>.
                </P>
                <P type="hint" data-test="paragraph-link-hint">
                    Hint text with <Link href="/">link</Link>.
                </P>
                <P type="label" data-test="paragraph-link-label">
                    Label text with <Link href="/">link</Link>.
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
