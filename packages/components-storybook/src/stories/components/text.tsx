import React from 'react';
import styled from 'styled-components';

import { storiesOf } from '@storybook/react';
import { text, select, number } from '@storybook/addon-knobs';
import { Tooltip, P, Link, H1, H2, H3, H4, H5, H6 } from '@trezor/components';
import { infoOptions } from '../../support/info';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

const Row = styled.div`
    margin: 0.5rem 0 2rem;
`;

const Wrapper = styled.div`
    padding: 1.6rem;

    p {
        margin-bottom: 10px;
    }
`;

const HoverMe = styled.span`
    padding: 8px;
    background: #ccc;
`;

Center.displayName = 'CenterWrapper';
Wrapper.displayName = 'Wrapper';
H1.displayName = 'H1';
H2.displayName = 'H2';
H3.displayName = 'H3';
H4.displayName = 'H4';
H5.displayName = 'H5';
H6.displayName = 'H6';

storiesOf('Typography', module).add(
    'All',
    () => {
        const pContent =
            'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Et harum quidem rerum facilis est et expedita distinctio. Fusce tellus. Nullam justo enim, consectetuer nec, ullamcorper ac, vestibulum in, elit. Mauris elementum mauris vitae tortor. Mauris metus.';
        return (
            <Wrapper>
                <H1>Heading</H1>
                <Row>
                    <H1 data-test="heading_1">Heading level 1</H1>
                    <H2 data-test="heading_2">Heading level 2</H2>
                    <H3 data-test="heading_3">Heading level 3</H3>
                    <H4 data-test="heading_4">Heading level 4</H4>
                    <H5 data-test="heading_5">Heading level 5</H5>
                    <H6 data-test="heading_6">Heading level 6</H6>
                </Row>
                <H1>Paragraph</H1>

                <H5>small</H5>
                <Row>
                    <P size="small" data-test="paragraph_small">
                        This is a SMALL paragraph with <Link href="/test">link</Link>.{pContent}
                    </P>
                </Row>

                <H5>medium</H5>
                <Row>
                    <P size="medium" data-test="paragraph_medium">
                        This is a MEDIUM paragraph with <Link href="/test">link</Link>.{pContent}
                    </P>
                </Row>

                <Row>
                    <H5>large</H5>
                    <P size="large" data-test="paragraph_large">
                        This is a LARGE paragraph with{' '}
                        <Link href="/test" variant="gray">
                            {' '}
                            gray link
                        </Link>
                        .{pContent}
                    </P>
                </Row>

                <Row>
                    <H5>xlarge</H5>
                    <P size="xlarge" data-test="paragraph_xlarge">
                        This is a XLARGE paragraph with <Link href="/test">link</Link>.{pContent}
                    </P>
                </Row>

                <H1>Tooltip</H1>
                <H5>basic</H5>
                <Row>
                    <Tooltip
                        maxWidth={280}
                        placement="top"
                        content="Passphrase is an optional feature."
                    >
                        <HoverMe>Hover me</HoverMe>
                    </Tooltip>
                </Row>

                <H5>with CTA button</H5>
                <Row>
                    <Tooltip
                        maxWidth={280}
                        placement="top"
                        content="Passphrase is an optional feature."
                        ctaLink="https://wiki.trezor.io/Passphrase"
                        ctaText="Learn more"
                    >
                        <HoverMe>Hover me</HoverMe>
                    </Tooltip>
                </Row>

                <H5>maxWidth limit</H5>
                <Row>
                    <Tooltip
                        maxWidth={280}
                        placement="top"
                        content={`Passphrase is an optional feature. ${pContent}`}
                        ctaLink="https://wiki.trezor.io/Passphrase"
                        ctaText="Learn more"
                    >
                        <HoverMe>Hover me</HoverMe>
                    </Tooltip>
                </Row>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);

storiesOf('Typography', module)
    .add(
        'Headings',
        () => {
            const level = select(
                'Style',
                {
                    H1: 'h1',
                    H2: 'h2',
                    H3: 'h3',
                    H4: 'h4',
                    H5: 'h5',
                    H6: 'h6',
                },
                'h1'
            );

            const textAlign = select(
                'textAlign',
                {
                    Default: null,
                    left: 'left',
                    center: 'center',
                    right: 'right',
                    justify: 'justify',
                },
                null
            );

            const props = {
                ...(textAlign ? { textAlign } : {}),
            };
            switch (level) {
                case 'h1': {
                    return <H1 {...props}>Heading level 1</H1>;
                }
                case 'h2': {
                    return <H2 {...props}>Heading level 2</H2>;
                }
                case 'h3': {
                    return <H3 {...props}>Heading level 3</H3>;
                }
                case 'h4': {
                    return <H4 {...props}>Heading level 4</H4>;
                }
                case 'h5': {
                    return <H5 {...props}>Heading level 5</H5>;
                }
                case 'h6': {
                    return <H6 {...props}>Heading level 6</H6>;
                }
                default: {
                    return <H1 {...props}>Heading level 1</H1>;
                }
            }
        },
        {
            info: {
                ...infoOptions,
                text: `
        ~~~js
        import { H1, H2, H3, H4, H5, H6 } from 'trezor-ui-components';
        ~~~
        `,
            },
        }
    )
    .add(
        'Link',
        () => {
            const variant = select(
                'Variant',
                {
                    'Default (green)': null,
                    Gray: 'gray',
                    'No style': 'nostyle',
                },
                null
            ) as 'gray' | 'nostyle';
            const target = select(
                'Target',
                {
                    None: null,
                    Blank: '_blank',
                    Self: '_self',
                    Parent: '_parent',
                    Top: '_top',
                },
                null
            );
            const href = text('URL', 'https://trezor.io');
            const linkText = text('Text', 'This is a link.');

            return (
                <Link href={href} {...(target ? { target } : {})} {...(variant ? { variant } : {})}>
                    {linkText}
                </Link>
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Link, variables } from 'trezor-ui-components';
            ~~~
            
            `,
            },
        }
    )
    .add(
        'Paragraph',
        () => {
            const size = select(
                'Size',
                {
                    Default: null,
                    small: 'small',
                    medium: 'medium',
                    large: 'large',
                    xlarge: 'xlarge',
                },
                null
            );
            const textAlign = select(
                'textAlign',
                {
                    Default: null,
                    left: 'left',
                    center: 'center',
                    right: 'right',
                    justify: 'justify',
                    inherit: 'inherit',
                    initial: 'initial',
                },
                null
            );
            const paragraphText = text('Text', 'This is a paragraph.');
            return (
                <P {...(size ? { size } : {})} {...(textAlign ? { textAlign } : {})}>
                    {paragraphText}
                </P>
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { P } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add(
        'Tooltip',
        () => {
            const placement: any = select(
                'Placement',
                {
                    Top: 'top',
                    Bottom: 'bottom',
                    Left: 'left',
                    Right: 'right',
                },
                'bottom'
            );

            return (
                <Center>
                    <Tooltip
                        maxWidth={number('Max width', 280)}
                        placement={placement}
                        content={text('Content', 'Passphrase is an optional feature.')}
                        ctaLink={text('CTA link', 'https://wiki.trezor.io/Passphrase')}
                        ctaText={text('CTA Text', 'Learn more')}
                    >
                        <span>Text with tooltip</span>
                    </Tooltip>
                </Center>
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Tooltip } from 'trezor-ui-components';
            ~~~
            *<Tooltip> is a wrapper around [Tippy.js for React](https://github.com/atomiks/tippy.js-react) component. See the [official documentation](https://github.com/atomiks/tippy.js-react) for more information about its props and usage.*
            `,
            },
        }
    );
