import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import StoryRouter from 'storybook-react-router';
import { Link } from 'react-router-dom';
import { withKnobs, select, number, color, text, object, boolean } from '@storybook/addon-knobs';
import { linkTo } from '@storybook/addon-links';

import CoinLogo from 'components/CoinLogo';
import TrezorImage from 'components/TrezorImage';
import Icon from 'components/Icon';
import { H1 } from 'components/Heading';
import Prompt from 'components/Prompt';
import Header from 'components/Header';

import colors from 'config/colors';
import icons from 'config/icons';
import { FONT_SIZE } from 'config/variables';

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

storiesOf('Other', module)
    .add('Coins & Icons', () => (
        <Wrapper>
            <H1>
                Icons <BtnLink onClick={linkTo('Other', 'Icon')}>{'<Icon />'}</BtnLink>
            </H1>

            <Icons>
                {Object.keys(icons).map(icon => {
                    return (
                        <Item>
                            <Title>{icon}</Title>
                            <Icon icon={icons[icon]} />
                        </Item>
                    );
                })}
            </Icons>

            <H1>
                Coins <BtnLink onClick={linkTo('Other', 'Coin')}>{'<CoinLogo />'}</BtnLink>
            </H1>

            <Icons>
                {coins.map(coin => {
                    console.log(coin);
                    return (
                        <Item>
                            <Title>{coin}</Title>
                            <CoinLogo height="23" network={coin} />
                        </Item>
                    );
                })}
            </Icons>
        </Wrapper>
    ))
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
            const coinsObject = {};
            coins.forEach(c => {
                coinsObject[c] = c;
            });
            const coinSelect = select('network', coinsObject, 'ada');
            const width = number('width', undefined);
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
            const iconSelect = select(
                'Icon',
                Object.fromEntries(Object.keys(icons).map(key => [key, key])),
                'TOP'
            );
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
                '1'
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
            const width = number('width', undefined);
            const height = number('height', 310);
            const model = select(
                'model',
                {
                    '1': 1,
                    '2': 2,
                },
                '1'
            );

            return <TrezorImage {...(width ? { width } : {})} height={height} model={model} />;
        },
        {
            info: {
                text: `
        ## Import
        ~~~js
        import { TrezorIMage } from 'trezor-ui-components';
        ~~~
        *<TrezorIMage> is just a styled <img> tag. See the [documentation](https://www.w3schools.com/tags/tag_img.asp) for more information about its props and usage.*
        `,
            },
        }
    )
    .addDecorator(StoryRouter())
    .add(
        'Header',
        () => {
            return (
                <Header
                    sidebarEnabled={boolean('sidebarEnabled', true)}
                    sidebarOpened={boolean('sidebarOpened', false)}
                    toggleSidebar={null}
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
    );
