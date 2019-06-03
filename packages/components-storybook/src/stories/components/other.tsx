import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { Link } from 'react-router-dom';
import { withKnobs, select, number, color, text, object, boolean } from '@storybook/addon-knobs';
import { linkTo } from '@storybook/addon-links';

import {
    icons,
    colors,
    Header,
    Prompt,
    H1,
    H5,
    Icon,
    Loader,
    TrezorLogo,
    TrezorImage,
    CoinLogo,
    variables,
    LanguagePicker,
} from '@trezor/components';

const { FONT_SIZE } = variables;

const coins = [
    'ada',
    'bch',
    'btc',
    'btg',
    'dash',
    'dgb',
    'doge',
    'etc',
    'eth',
    'ltc',
    'nem',
    'nmc',
    'rinkeby',
    'trop',
    'txrp',
    'vtc',
    'xem',
    'xlm',
    'xrp',
    'zec',
    'xtz',
];

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const Section = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    margin: 2rem 0 3rem;
`;

const SectionDark = styled(Section)`
    background: ${colors.HEADER};
`;

const LanguageWrapper = styled.div`
    background-color: ${colors.HEADER};
    display: flex;
    justify-content: center;
`;
LanguageWrapper.displayName = 'Header';

const Icons = styled.div`
    display: flex;
    flex-wrap: wrap;
    padding: 1.6rem;
`;

const Item = styled.div`
    flex-basis: 20%;
    padding: 1rem 0 2rem;
    text-align: center;
`;

const Title = styled.div`
    color: ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.SMALL};
    margin-bottom: 0.5rem;
`;

const BtnLink = styled.button`
    font-size: 1rem;
    color: ${colors.TEXT_SECONDARY};
    vertical-align: middle;
    background: ${colors.LANDING};
    padding: 0.5rem;
    border: none;
    border-radius: 5px;
`;

storiesOf('Other', module).add('All', () => (
    <Wrapper>
        <H1>Prompt</H1>
        <H5>
            Trezor One{' '}
            <BtnLink onClick={linkTo('Other', 'Prompt')}>{'<Prompt model="1" />'}</BtnLink>
        </H5>
        <Section>
            <Prompt model={1} data-test="prompt_1">
                Complete the action on your device
            </Prompt>
        </Section>

        <H5>
            Trezor Model T{' '}
            <BtnLink onClick={linkTo('Other', 'Prompt')}>{'<Prompt model="2" />'}</BtnLink>
        </H5>
        <Section>
            <Prompt model={2} data-test="prompt_2">
                Complete the action on your device
            </Prompt>
        </Section>

        <H1>TrezorImage</H1>
        <H5>
            Trezor One{' '}
            <BtnLink onClick={linkTo('Other', 'TrezorImage')}>
                {'<TrezorImage model="1" />'}
            </BtnLink>
        </H5>
        <Section>
            <TrezorImage height={310} model={1} data-test="trezor_image_1" />
        </Section>

        <H5>
            Trezor Model T{' '}
            <BtnLink onClick={linkTo('Other', 'TrezorImage')}>
                {'<TrezorImage model="2" />'}
            </BtnLink>
        </H5>
        <Section>
            <TrezorImage height={310} model={2} data-test="trezor_image_2" />
        </Section>

        <H1>TrezorLogo</H1>
        <H5>
            Horizontal{' '}
            <BtnLink onClick={linkTo('Other', 'TrezorLogo')}>
                {'<TrezorLogo type="horizontal" />'}
            </BtnLink>
        </H5>
        <Section>
            <TrezorLogo type="horizontal" width="90%" data-test="trezor_logo_horizontal" />
        </Section>

        <H5>
            Vertical{' '}
            <BtnLink onClick={linkTo('Other', 'TrezorLogo')}>
                {'<TrezorLogo type="vertical" />'}
            </BtnLink>
        </H5>
        <Section>
            <TrezorLogo type="vertical" width="50%" data-test="trezor_logo_vertical" />
        </Section>

        <H1>
            Header <BtnLink onClick={linkTo('Other', 'Header')}>{'<Header />'}</BtnLink>
        </H1>
        <Section>
            <Header
                sidebarEnabled
                sidebarOpened={false}
                toggleSidebar={undefined}
                togglerOpenText="Menu"
                togglerCloseText="Close"
                rightAddon={null}
                links={[
                    {
                        href: 'https://trezor.io/',
                        title: 'Trezor',
                    },
                    {
                        href: 'https://wiki.trezor.io/',
                        title: 'Wiki',
                    },
                    {
                        href: 'https://blog.trezor.io/',
                        title: 'Blog',
                    },
                ]}
                data-test="header"
            />
        </Section>

        <H1>Loader</H1>
        <H5>
            default <BtnLink onClick={linkTo('Other', 'Loader')}>{'<Loader />'}</BtnLink>
        </H5>
        <Section>
            <Loader size={100} strokeWidth={2} text="loading" data-test="loader_default" />
        </Section>

        <H5>
            small text{' '}
            <BtnLink onClick={linkTo('Other', 'Loader')}>{'<Loader isSmallText />'}</BtnLink>
        </H5>
        <Section>
            <Loader
                size={100}
                strokeWidth={2}
                text="loading"
                isSmallText
                data-test="loader_small_text"
            />
        </Section>

        <H5>
            transparent route{' '}
            <BtnLink onClick={linkTo('Other', 'Loader')}>{'<Loader transparentRoute />'}</BtnLink>
        </H5>
        <Section>
            <Loader
                size={100}
                strokeWidth={2}
                text="loading"
                transparentRoute
                data-test="loader_transparent_route"
            />
        </Section>

        <H5>
            white text{' '}
            <BtnLink onClick={linkTo('Other', 'Loader')}>{'<Loader isWhiteText />'}</BtnLink>
        </H5>
        <SectionDark>
            <Loader
                size={100}
                strokeWidth={2}
                text="loading"
                isWhiteText
                data-test="loader_white_text"
            />
        </SectionDark>

        <H5>
            white text &amp; transparent route{' '}
            <BtnLink onClick={linkTo('Other', 'Loader')}>
                {'<Loader isWhiteText transparentRoute />'}
            </BtnLink>
        </H5>
        <SectionDark>
            <Loader
                size={100}
                strokeWidth={2}
                text="loading"
                isWhiteText
                transparentRoute
                data-test="loader_white_text_transparent"
            />
        </SectionDark>

        <H1>
            Icons <BtnLink onClick={linkTo('Other', 'Icon')}>{'<Icon />'}</BtnLink>
        </H1>
        <Icons>
            {Object.keys(icons).map(icon => {
                const test = `icon_${icon.toLowerCase()}`;
                return (
                    <Item>
                        <Title>{icon}</Title>
                        <Icon icon={icons[icon]} data-test={test} />
                    </Item>
                );
            })}
        </Icons>

        <H1>
            Coins <BtnLink onClick={linkTo('Other', 'Coin')}>{'<CoinLogo />'}</BtnLink>
        </H1>
        <Icons>
            {coins.map(coin => {
                const test = `coin_${coin.toLowerCase()}`;
                return (
                    <Item>
                        <Title>{coin}</Title>
                        <CoinLogo height="23" network={coin} data-test={test} />
                    </Item>
                );
            })}
        </Icons>
    </Wrapper>
));

storiesOf('Other', module)
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
        })
    )
    .addDecorator(withKnobs)
    .add(
        'Coin',
        () => {
            const coinsObject: any = {};
            coins.forEach(c => {
                coinsObject[c] = c;
            });
            const coinSelect = select('network', coinsObject, 'ada');
            const width = number('width', NaN);
            const height = number('height', 23);
            return <CoinLogo {...(width ? { width } : {})} height={height} network={coinSelect} />;
        },
        {
            info: {
                text: `
            ## Import

            ~~~js
            Import { CoinLogo } from 'trezor-ui-components';
            ~~~

            *<CoinLogo> is just a styling wrapper around <img> tag. See the [documentation](https://www.w3schools.com/tags/tag_img.asp) for more information about its props and usage.*

            `,
            },
        }
    )
    .add(
        'Icon',
        () => {
            const iconSize = number('Size', 36);

            const iconOptions: any = {
                None: null,
            };
            Object.keys(icons).forEach(icon => {
                iconOptions[icon] = icon;
            });

            const iconSelect = select('Icon', iconOptions, 'TOP');
            const hasHover = boolean('With hover', false);

            let hoverColor;
            if (hasHover) {
                hoverColor = color('Hover color', colors.GREEN_PRIMARY);
            }
            return <Icon icon={iconSelect} size={iconSize} {...(hasHover ? hoverColor : {})} />;
        },
        {
            info: {
                text: `
            ## Import
            ~~~js
            import { Icon } from 'trezor-ui-components';
            ~~~

            Example
            ~~~js
            <Icon icon="TOP" /> 
            ~~~

            Another way to use the Icon component, allowing the usage of custom icons, is to pass an icon object instead of icon name. 
            
            Example
            ~~~js
            import { Icon } from 'trezor-ui-components';

            const T2 = {
                paths: [
                    'M 625.28 546.304 c 0 4.512 -3.84 8 -8.32 8 l -209.92 0 c -4.48 0 -8.32 -3.488 -8.32 -8 l 0 -202.208 c 0 -4.512 3.84 -8.32 8.32 -8.32 l 209.92 0 c 4.48 0 8.32 3.808 8.32 8.32 l 0 202.208 Z m 18.56 -304.32 l -263.68 0 c -23.04 0 -41.92 18.56 -41.92 41.28 l 0 233.952 c 0 55.04 16 108.768 46.72 155.168 l 64.64 96.992 c 5.12 8 13.76 12.448 23.36 12.448 l 78.4 0 c 9.28 0 17.92 -4.448 23.04 -11.84 l 60.16 -86.048 c 33.6 -47.68 51.2 -103.392 51.2 -161.28 l 0 -239.392 c 0 -22.72 -18.88 -41.28 -41.92 -41.28',
                ],
                viewBox: '338.24005126953125 241.9840087890625 347.51995849609375 539.8400268554688',
                ratio: 0.6437,
            };

            <Icon icon={T2} /> 
            ~~~
            `,
            },
        }
    )
    .add(
        'Prompt',
        () => {
            const model = select(
                'model',
                {
                    '1': 1,
                    '2': 2,
                },
                1
            );

            return (
                <Prompt model={model} size={number('size', 32)}>
                    {text('children', 'Complete the action on your device')}
                </Prompt>
            );
        },
        {
            info: {
                text: `
        ## Import
        ~~~js
        import { Prompt } from 'trezor-ui-components';
        ~~~
        `,
            },
        }
    )
    .add(
        'TrezorImage',
        () => {
            const width = number('width', NaN);
            const height = number('height', 310);
            const modelOptions: any = {
                '1': 1,
                '2': 2,
            };
            const model = select('model', modelOptions, 1);

            return <TrezorImage {...(width ? { width } : {})} height={height} model={model} />;
        },
        {
            info: {
                text: `
        ## Import
        ~~~js
        import { TrezorImage } from 'trezor-ui-components';
        ~~~
        *<TrezorImage> is just a styled <img> tag. See the [documentation](https://www.w3schools.com/tags/tag_img.asp) for more information about its props and usage.*
        `,
            },
        }
    )
    .add(
        'TrezorLogo',
        () => {
            const width = number('width', 100);
            const height = number('height', NaN);
            const type = select(
                'type',
                {
                    horizontal: 'horizontal',
                    vertical: 'vertical',
                },
                'horizontal'
            );

            return (
                <TrezorLogo
                    type={type}
                    {...(width ? { width } : {})}
                    {...(height ? { height } : {})}
                />
            );
        },
        {
            info: {
                text: `
        ## Import
        ~~~js
        import { TrezorLogo } from 'trezor-ui-components';
        ~~~
        *<TrezorLogo> is just a styled <img> tag. See the [documentation](https://www.w3schools.com/tags/tag_img.asp) for more information about its props and usage.*
        `,
            },
        }
    )
    .add(
        'Loader',
        () => {
            const isWhiteText = boolean('White text', false);
            const isSmallText = boolean('Small text', false);
            const transparentRoute = boolean('Transparent route', false);

            return (
                <Loader
                    size={number('Size', 100)}
                    strokeWidth={number('Stroke width', 1)}
                    text={text('Text', 'loading')}
                    {...(isWhiteText ? { isWhiteText } : {})}
                    {...(isSmallText ? { isSmallText } : {})}
                    {...(transparentRoute ? { transparentRoute } : {})}
                />
            );
        },
        {
            info: {
                text: `
            ## Import
            ~~~js
            import { Loader } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add(
        'Header',
        () => {
            return (
                <Header
                    sidebarEnabled={boolean('sidebarEnabled', true)}
                    sidebarOpened={boolean('sidebarOpened', false)}
                    togglerOpenText={text('togglerOpenText', 'Menu')}
                    togglerCloseText={text('togglerCloseText', 'Close')}
                    rightAddon={null}
                    logoLinkComponent={<Link to="/" />}
                    links={object('links', [
                        {
                            href: 'https://trezor.io/',
                            title: 'Trezor',
                        },
                        {
                            href: 'https://wiki.trezor.io/',
                            title: 'Wiki',
                        },
                        {
                            href: 'https://blog.trezor.io/',
                            title: 'Blog',
                        },
                        {
                            href: 'https://trezor.io/support/',
                            title: 'Support',
                        },
                    ])}
                />
            );
        },
        {
            info: {
                text: `
        ## Import
        ~~~js
        import { Header } from 'trezor-ui-components';
        ~~~
        `,
            },
        }
    )
    .add(
        'LanguagePicker',
        () => {
            const language = select(
                'language',
                {
                    en: 'en',
                    bn: 'bn',
                    cs: 'cs',
                    de: 'de',
                    el: 'el',
                    es: 'es',
                    fr: 'fr',
                    id: 'id',
                    it: 'it',
                    ja: 'ja',
                    nl: 'nl',
                    pl: 'pl',
                    pt: 'pt',
                    ru: 'ru',
                    uk: 'uk',
                    zh: 'zh',
                    'zh-TW': 'zh-TW',
                },
                'en'
            );
            return (
                <LanguageWrapper>
                    <LanguagePicker
                        language={language}
                        onChange={option => {
                            console.log(`value changed. value: ${JSON.stringify(option)}`);
                        }}
                        languages={[
                            { code: 'en', name: 'English', en: 'English' },
                            { code: 'bn', name: 'Bengali', en: 'Bengali' },
                            { code: 'cs', name: 'Česky', en: 'Czech' },
                            { code: 'de', name: 'Deutsch', en: 'German' },
                            { code: 'el', name: 'Ελληνικά', en: 'Greek' },
                            { code: 'es', name: 'Español', en: 'Spanish' },
                            { code: 'fr', name: 'Français', en: 'French' },
                            { code: 'id', name: 'Bahasa Indonesia', en: 'Indonesian' },
                            { code: 'it', name: 'Italiano', en: 'Italian' },
                            { code: 'ja', name: '日本語', en: 'Japanese' },
                            { code: 'nl', name: 'Nederlands', en: 'Dutch' },
                            { code: 'pl', name: 'Polski', en: 'Polish' },
                            { code: 'pt', name: 'Português', en: 'Portuguese' },
                            { code: 'ru', name: 'Русский', en: 'Russian' },
                            { code: 'uk', name: 'Українська', en: 'Ukrainian' },
                            { code: 'zh', name: '中文(简体)', en: 'Chinese Simplified' },
                            { code: 'zh-TW', name: '中文(台灣)', en: 'Chinese Traditional' },
                        ]}
                        data-test="language_picker"
                    />
                </LanguageWrapper>
            );
        },
        {
            info: {
                text: `
        ## Import
        ~~~js
        import { LanguagePicker } from 'trezor-ui-components';
        ~~~
        `,
            },
        }
    );
