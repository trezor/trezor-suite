import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Link } from 'react-router-dom';
import { select, number, color, text, object, boolean } from '@storybook/addon-knobs';
import {
    colors,
    Header,
    Prompt,
    H1,
    H5,
    Icon,
    IconProps,
    Loader,
    TrezorLogo,
    TrezorImage,
    CoinLogo,
    variables,
    LanguagePicker,
} from '@trezor/components';
import { infoOptions } from '../../support/info';
import Colors from './colors';

const { FONT_SIZE, COINS, ICONS } = variables;

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

storiesOf('Other', module)
    .add(
        'All',
        () => (
            <Wrapper>
                <H1>Prompt</H1>
                <H5>Trezor One</H5>
                <Section>
                    <Prompt model={1} data-test="prompt_1">
                        Complete the action on your device
                    </Prompt>
                </Section>

                <H5>Trezor Model T</H5>
                <Section>
                    <Prompt model={2} data-test="prompt_2">
                        Complete the action on your device
                    </Prompt>
                </Section>

                <H1>TrezorImage</H1>
                <H5>Trezor One</H5>
                <Section>
                    <TrezorImage height={310} model={1} data-test="trezor_image_1" />
                </Section>

                <H5>Trezor Model T</H5>
                <Section>
                    <TrezorImage height={310} model={2} data-test="trezor_image_2" />
                </Section>

                <H1>TrezorLogo</H1>
                <H5>Horizontal</H5>
                <Section>
                    <TrezorLogo type="horizontal" width="90%" data-test="trezor_logo_horizontal" />
                </Section>

                <H5>Vertical</H5>
                <Section>
                    <TrezorLogo type="vertical" width="50%" data-test="trezor_logo_vertical" />
                </Section>

                <H1>Header</H1>
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
                <H5>default</H5>
                <Section>
                    <Loader size={100} strokeWidth={2} text="loading" data-test="loader_default" />
                </Section>

                <H5>small text</H5>
                <Section>
                    <Loader
                        size={100}
                        strokeWidth={2}
                        text="loading"
                        isSmallText
                        data-test="loader_small_text"
                    />
                </Section>

                <H5>transparent route</H5>
                <Section>
                    <Loader
                        size={100}
                        strokeWidth={2}
                        text="loading"
                        transparentRoute
                        data-test="loader_transparent_route"
                    />
                </Section>

                <H5>white text</H5>
                <SectionDark>
                    <Loader
                        size={100}
                        strokeWidth={2}
                        text="loading"
                        isWhiteText
                        data-test="loader_white_text"
                    />
                </SectionDark>

                <H5>white text &amp; transparent route</H5>
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

                <H1>Icons</H1>
                <Icons>
                    {ICONS.map((icon: IconProps['icon']) => {
                        const test = `icon_${icon.toLowerCase()}`;
                        return (
                            <Item key={icon}>
                                <Title>{icon}</Title>
                                <Icon icon={icon} data-test={test} />
                            </Item>
                        );
                    })}
                </Icons>

                <H1>Coins</H1>
                <Icons>
                    {COINS.map((coin: string) => {
                        const test = `coin_${coin.toLowerCase()}`;
                        return (
                            <Item key={coin}>
                                <Title>{coin}</Title>
                                <CoinLogo size={32} symbol={coin} data-test={test} />
                            </Item>
                        );
                    })}
                </Icons>
            </Wrapper>
        ),
        {
            info: {
                disable: true,
            },
        }
    )
    .add(
        'Coin',
        () => {
            const coinsObject: any = {};
            COINS.forEach((coin: string) => {
                coinsObject[coin] = coin;
            });
            const coinSelect = select('symbol', coinsObject, 'ada');
            const size = number('size', 32);
            return <CoinLogo size={size} symbol={coinSelect} />;
        },
        {
            info: {
                ...infoOptions,
                text: `

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
            ICONS.forEach((icon: string) => {
                iconOptions[icon] = icon;
            });

            const iconSelect = select('Icon', iconOptions, 'TOP');
            const hasHover = boolean('With hover', false);

            let hoverColor;
            if (hasHover) {
                hoverColor = color('Hover color', colors.GREEN_PRIMARY);
            }
            return <Icon icon={iconSelect} size={iconSize} {...(hasHover ? { hoverColor } : {})} />;
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Icon } from 'trezor-ui-components';
            ~~~

            Example
            ~~~js
            <Icon icon="TOP" /> 
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
            ) as number;

            return (
                <Prompt model={model} size={number('size', 32)}>
                    {text('children', 'Complete the action on your device')}
                </Prompt>
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
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
            const model = select(
                'model',
                {
                    '1': 1,
                    '2': 2,
                },
                1
            );

            return <TrezorImage {...(width ? { width } : {})} height={height} model={model} />;
        },
        {
            info: {
                ...infoOptions,
                text: `
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
            type LogoType = 'horizontal' | 'vertical';
            type LogoVariant = 'black' | 'white';

            const width = number('width', 100);
            const height = number('height', NaN);
            const type = select(
                'type',
                {
                    horizontal: 'horizontal',
                    vertical: 'vertical',
                },
                'horizontal'
            ) as LogoType;
            const variant = select(
                'variant',
                {
                    black: 'black',
                    white: 'white',
                },
                'black'
            ) as LogoVariant;

            return (
                <TrezorLogo
                    type={type}
                    variant={variant}
                    {...(width ? { width } : {})}
                    {...(height ? { height } : {})}
                />
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
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
                ...infoOptions,
                text: `
            ~~~js
            import { Loader } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    );

storiesOf('Other', module).add(
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
            ...infoOptions,
            text: `
        ~~~js
        import { Header } from 'trezor-ui-components';
        ~~~
        `,
        },
    }
);

storiesOf('Other', module)
    .add(
        'LanguagePicker',
        () => {
            const language: string = select(
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
                ...infoOptions,
                text: `
        ~~~js
        import { LanguagePicker } from 'trezor-ui-components';
        ~~~
        `,
            },
        }
    )
    .add('Colors', () => <Colors />, {
        info: {
            disable: true,
        },
    });
