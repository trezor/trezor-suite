import React from 'react';
import styled from 'styled-components';

import { storiesOf } from '@storybook/react';
import {
    withKnobs, boolean, text, select, radios, number,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

import {
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
} from 'components/Heading';
import Link from 'components/Link';
import P from 'components/Paragraph';
import Tooltip from 'components/Tooltip';

import colors from 'config/colors';

const Wrapper = styled.div``;

Wrapper.displayName = 'Wrapper';
H1.displayName = 'H1';
H2.displayName = 'H2';
H3.displayName = 'H3';
H4.displayName = 'H4';

storiesOf('Typography', module)
    .add('All', () => (
        <Wrapper>
            <H1>Heading level 1</H1>
            <P>
                This is a paragraph with <Link href="/test" isGreen>link</Link>.
            </P>
            <P isSmaller>
                This is a smaller paragraph with <Link href="/test" isGreen isSmaller>link</Link>.
            </P>

            <H2>Heading level 2</H2>
            <P>
                This is a paragraph.
            </P>
            <P isSmaller>This is a smaller paragraph.</P>

            <H3>Heading level 3</H3>
            <P>This is a paragraph.</P>
            <P isSmaller>This is a smaller paragraph.</P>

            <H4>Heading level 4</H4>
            <P>This is a paragraph.</P>
            <P isSmaller>This is a smaller paragraph.</P>

            <H5>Heading level 5</H5>
            <P>This is a paragraph.</P>
            <P isSmaller>This is a smaller paragraph.</P>

            <H6>Heading level 6</H6>
            <P isSmaller>This is a smaller paragraph.</P>
        </Wrapper>
    ));

storiesOf('Typography', module)
    .addDecorator(
        withInfo({
            header: false,
            inline: true,
            maxPropsIntoLine: 1,
            styles: {
                infoStory: {
                    background: colors.LANDING,
                    borderBottom: `1px solid ${colors.DIVIDER}`,
                    padding: '30px',
                    margin: '-8px',
                },
                infoBody: {
                    border: 'none',
                    padding: '15px',
                },
            },
            excludedPropTypes: ['children'],
        }),
    )
    .addDecorator(withKnobs)
    .add('Headings', () => {
        const level = select('Style', {
            H1: 'h1',
            H2: 'h2',
            H3: 'h3',
            H4: 'h4',
            H5: 'h5',
            H6: 'h6',
        });

        switch (level) {
            case 'h1': {
                return <H1>Heading level 1</H1>;
            }
            case 'h2': {
                return <H2>Heading level 2</H2>;
            }
            case 'h3': {
                return <H3>Heading level 3</H3>;
            }
            case 'h4': {
                return <H4>Heading level 4</H4>;
            }
            case 'h5': {
                return <H5>Heading level 4</H5>;
            }
            case 'h6': {
                return <H6>Heading level 4</H6>;
            }
            default: {
                return <H1>Heading level 1</H1>;
            }
        }
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { H1, H2, H3, H4, H5, H6 } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Link', () => {
        const color = radios('Color', {
            Green: 'green',
            Gray: 'gray',
        }, 'green');
        const target = select('Target', {
            None: '',
            Blank: '_blank',
            Self: '_self',
            Parent: '_parent',
            Top: '_top',
        }, '');
        const href = text('URL', 'https://trezor.io');
        const linkText = text('Text', 'This is a link.');
        const isSmaller = boolean('Smaller', false);

        if (color === 'green') {
            return (
                <Link
                    href={href}
                    target={target}
                    isSmaller={isSmaller}
                    isGreen
                >
                    {linkText}
                </Link>
            );
        }

        return (
            <Link
                href={href}
                target={target}
                isSmaller={isSmaller}
                isGray
            >
                {linkText}
            </Link>
        );
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { Link } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Paragraph', () => {
        const isSmaller = boolean('Smaller', false);
        const paragraphText = text('Text', 'This is a paragraph.');
        if (isSmaller) {
            return <P isSmaller>{paragraphText}</P>;
        }
        return <P>{paragraphText}</P>;
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { P } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
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
            <span>Text with tooltip</span>
        </Tooltip>
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { Tooltip } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
