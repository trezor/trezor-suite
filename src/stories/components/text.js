import React from 'react';
import styled from 'styled-components';

import { storiesOf } from '@storybook/react';
import {
    withKnobs, boolean, text, select, radios, number,
} from '@storybook/addon-knobs';
import centered from '@storybook/addon-centered';
import { withInfo } from '@storybook/addon-info';

import {
    H1,
    H2,
    H3,
    H4,
} from 'components/Heading';
import Link from 'components/Link';
import P from 'components/Paragraph';
import Tooltip from 'components/Tooltip';

const Wrapper = styled.div``;

Wrapper.displayName = 'Wrapper';
H1.displayName = 'H1';
H2.displayName = 'H2';
H3.displayName = 'H3';
H4.displayName = 'H4';

storiesOf('Text', module)
    .addDecorator(
        withInfo({
            header: true,
        }),
    )
    .addDecorator(centered)
    .addDecorator(withKnobs)
    .add('Headings', () => (
        <Wrapper>
            <H1>Heading level 1</H1>
            <H2>Heading level 2</H2>
            <H3>Heading level 3</H3>
            <H4>Heading level 4</H4>
        </Wrapper>
    ))
    .add('Link', () => {
        const color = radios('Color', {
            Green: 'green',
            Gray: 'gray',
        }, 'green');

        return (
            <Link
                href={text('URL', 'https://trezor.io')}
                target={select('Target', {
                    None: '',
                    Blank: '_blank',
                    Self: '_self',
                    Parent: '_parent',
                    Top: '_top',
                }, '')}
                isGreen={color === 'green'}
                isGray={color === 'gray'}
            >
                {text('Text', 'This is a link.')}
            </Link>
        );
    })
    .add('Paragraph', () => <P isSmaller={boolean('Smaller', false)}>{text('Text', 'This is a paragraph.')}</P>)
    .add('Tooltip', () => (
        <Tooltip
            maxWidth={number('Max width', 280)}
            placement={select('Placement', {
                Top: 'top',
                Bottom: 'bottom',
                Left: 'left',
                Right: 'right',
            }, 'bottom')}
            content={text('Content', 'Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet.')}
            readMoreLink={text('Read more link', 'https://wiki.trezor.io/Passphrase')}
        >
            <div>Text with tooltip</div>
        </Tooltip>
    ));
