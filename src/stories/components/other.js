import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, select, text, number, color, boolean } from '@storybook/addon-knobs';
import { linkTo } from '@storybook/addon-links';

import CoinLogo from 'components/images/CoinLogo';
import Icon from 'components/Icon';
import { H1 } from 'components/Heading';
import Prompt from 'components/Prompt';

import colors from 'config/colors';
import icons from 'config/icons';
import { FONT_SIZE } from 'config/variables';

const coins = {
    ADA: 'ada',
    BCH: 'bch',
    BTC: 'btc',
    BTG: 'btg',
    DASH: 'dash',
    DGB: 'dgb',
    DOGE: 'doge',
    ETC: 'etc',
    ETH: 'eth',
    LTC: 'ltc',
    NEM: 'nem',
    NMC: 'nmc',
    RINKEBY: 'rinkeby',
    TROP: 'trop',
    TXRP: 'txrp',
    VTC: 'vtc',
    XEM: 'xem',
    XLM: 'xlm',
    XRP: 'xrp',
    ZEC: 'zec',
};

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
    padding: 0.5rem 0 1rem;
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

const CoinLogoInline = styled(CoinLogo)`
    display: inline;
    padding: 0;
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
                {Object.keys(coins).map(coin => {
                    return (
                        <Item>
                            <Title>{coin}</Title>
                            <CoinLogoInline network={coins[coin]} />
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
    .add('Coin', () => <CoinLogo network={select('Coin', coins, 'ada')} />, {
        info: {
            text: `
            ## Import

            ~~~js
            Import { CoinLogo } from 'trezor-ui-components';
            ~~~

            `,
        },
    })
    .add(
        'Icon',
        () => {
            const iconSize = number('Size', 36);
            const iconSelect = select(
                'Icon',
                Object.fromEntries(Object.keys(icons).map(key => [key, icons[key]])),
                icons.TOP
            );
            const hasHover = boolean('With hover', false);

            if (hasHover) {
                const hoverColor = color('Hover color', colors.GREEN_PRIMARY);
                return <Icon icon={iconSelect} size={iconSize} hoverColor={hoverColor} />;
            }
            return <Icon icon={iconSelect} size={iconSize} />;
        },
        {
            info: {
                text: `
            ## Import
            ~~~js
            import { Icon, icons } from 'trezor-ui-components';
            ~~~

            Example
            ~~~js
            <Icon icon={icons.TOP} />
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
                    '1': '1',
                    '2': '2',
                },
                '1'
            );

            return <Prompt text={text('text', 'Complete action on your device')} model={model} />;
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
    );
