import { StoryColumn } from '../../support/Story';
import { H1, H2, Paragraph, Link } from '../../index';
import { Meta, StoryFn } from '@storybook/react';

export default {
    title: 'Typography/All',
} as Meta;

export const All: StoryFn = () => (
    <>
        <StoryColumn>
            <H1 data-test-id="heading-1">Heading 1</H1>
            <H2 data-test-id="heading-2">Heading 2</H2>
        </StoryColumn>
        <StoryColumn>
            <Paragraph data-test-id="paragraph-default">
                default
                <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>
            <Paragraph type="titleLarge" data-test-id="paragraph-titleLarge">
                type="titleLarge" <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>
            <Paragraph type="titleMedium" data-test-id="paragraph-titleMedium">
                type="titleMedium" <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>
            <Paragraph type="titleSmall" data-test-id="paragraph-titleSmall">
                type ="titleSmall" <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>
            <Paragraph type="highlight" data-test-id="paragraph-highlight">
                type="highlight" <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>
            <Paragraph type="callout" data-test-id="paragraph-callout">
                type="callout" <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>
            <Paragraph type="hint" data-test-id="paragraph-hint">
                type="hint" <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>
            <Paragraph type="label" data-test-id="paragraph-label">
                type="label" <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a ante quis lectus
                eleifend rutrum. Aenean tincidunt odio vel fermentum ultricies. Sed suscipit
                interdum eros, eget placerat lorem pulvinar in. Ut elit orci, rhoncus eu porta vel,
                feugiat vel mi.
            </Paragraph>

            <Paragraph data-test-id="paragraph-link">
                Default text with <Link href="/">link</Link>.
            </Paragraph>
            <Paragraph type="hint" data-test-id="paragraph-link-hint">
                Hint text with <Link href="/">link</Link>.
            </Paragraph>
            <Paragraph type="label" data-test-id="paragraph-link-label">
                Label text with <Link href="/">link</Link>.
            </Paragraph>
        </StoryColumn>
    </>
);
