import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import {
    H1, H2, H3, H4,
} from 'components/Heading';
import Link from 'components/Link';
import P from 'components/Paragraph';
import Tooltip from 'components/Tooltip';

storiesOf('Text', module)
    .addWithJSX('Heading H1', () => <H1>Hello World!</H1>)
    .addWithJSX('Heading H2', () => <H2>Hello World!</H2>)
    .addWithJSX('Heading H3', () => <H3>Hello World!</H3>)
    .addWithJSX('Heading H4', () => <H4>Hello World!</H4>)
    .addWithJSX('Link', () => <Link href="https://trezor.io">This is a link.</Link>)
    .addWithJSX('Paragraph', () => <P>This is a paragraph.</P>)
    .addWithJSX('Paragraph small', () => <P isSmaller>This is a paragraph.</P>)
    .addWithJSX('Tooltip', () => (
        <Tooltip
            maxWidth={280}
            placement="bottom"
            content="Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet."
            readMoreLink="https://wiki.trezor.io/Passphrase"
        >
            <div>Text with tooltip</div>
        </Tooltip>
    ));
