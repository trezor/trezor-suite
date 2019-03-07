import CoinLogo from 'components/images/CoinLogo';
import Icon from 'components/Icon';
import { H1 } from 'components/Heading';
import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, select, number, color, boolean } from '@storybook/addon-knobs';
import { linkTo } from '@storybook/addon-links';

import colors from 'config/colors';
import icons from 'config/icons';
import { FONT_SIZE } from 'config/variables';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-evenly;
    padding: 1rem 0;
    margin: 0.5rem 0 1rem;
`;

const Col = styled.div`
    width: 100px;
    text-align: center;
    padding: 0.5rem;
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
            <Row>
                <Col>
                    <Title>TOP</Title>
                    <Icon icon={icons.TOP} size={42} />
                </Col>
                <Col>
                    <Title>EYE_CROSSED</Title>
                    <Icon icon={icons.EYE_CROSSED} size={42} />
                </Col>
                <Col>
                    <Title>EYE</Title>
                    <Icon icon={icons.EYE} size={42} />
                </Col>
                <Col>
                    <Title>CHECKED</Title>
                    <Icon icon={icons.CHECKED} size={42} />
                </Col>
                <Col>
                    <Title>BACK</Title>
                    <Icon icon={icons.BACK} size={42} />
                </Col>
                <Col>
                    <Title>HELP</Title>
                    <Icon icon={icons.HELP} size={42} />
                </Col>
                <Col>
                    <Title>REFRESH</Title>
                    <Icon icon={icons.REFRESH} size={42} />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Title>T1</Title>
                    <Icon icon={icons.T1} size={42} />
                </Col>
                <Col>
                    <Title>COG</Title>
                    <Icon icon={icons.COG} size={42} />
                </Col>
                <Col>
                    <Title>EJECT</Title>
                    <Icon icon={icons.EJECT} size={42} />
                </Col>
                <Col>
                    <Title>CLOSE</Title>
                    <Icon icon={icons.CLOSE} size={42} />
                </Col>
                <Col>
                    <Title>DOWNLOAD</Title>
                    <Icon icon={icons.DOWNLOAD} size={42} />
                </Col>
                <Col>
                    <Title>PLUS</Title>
                    <Icon icon={icons.PLUS} size={42} />
                </Col>
                <Col>
                    <Title>ARROW_UP</Title>
                    <Icon icon={icons.ARROW_UP} size={42} />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Title>ARROW_LEFT</Title>
                    <Icon icon={icons.ARROW_LEFT} size={42} />
                </Col>
                <Col>
                    <Title>ARROW_DOWN</Title>
                    <Icon icon={icons.ARROW_DOWN} size={42} />
                </Col>
                <Col>
                    <Title>CHAT</Title>
                    <Icon icon={icons.CHAT} size={42} />
                </Col>
                <Col>
                    <Title>SKIP</Title>
                    <Icon icon={icons.SKIP} size={42} />
                </Col>
                <Col>
                    <Title>WARNING</Title>
                    <Icon icon={icons.WARNING} size={42} />
                </Col>
                <Col>
                    <Title>INFO</Title>
                    <Icon icon={icons.INFO} size={42} />
                </Col>
                <Col>
                    <Title>ERROR</Title>
                    <Icon icon={icons.ERROR} size={42} />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Title>WALLET_STANDARD</Title>
                    <Icon icon={icons.WALLET_STANDARD} size={42} />
                </Col>
                <Col>
                    <Title>WALLET_HIDDEN</Title>
                    <Icon icon={icons.WALLET_HIDDEN} size={42} />
                </Col>
                <Col>
                    <Title>MENU</Title>
                    <Icon icon={icons.MENU} size={42} />
                </Col>
                <Col>
                    <Title>QRCODE</Title>
                    <Icon icon={icons.QRCODE} size={42} />
                </Col>
            </Row>
            <H1>
                Coins <BtnLink onClick={linkTo('Other', 'Coin')}>{'<CoinLogo />'}</BtnLink>
            </H1>
            <Row>
                <Col>
                    <Title>ada</Title>
                    <CoinLogoInline network="ada" />
                </Col>
                <Col>
                    <Title>bch</Title>
                    <CoinLogoInline network="bch" />
                </Col>
                <Col>
                    <Title>btc</Title>
                    <CoinLogoInline network="btc" />
                </Col>
                <Col>
                    <Title>btg</Title>
                    <CoinLogoInline network="btg" />
                </Col>
                <Col>
                    <Title>dash</Title>
                    <CoinLogoInline network="dash" />
                </Col>
                <Col>
                    <Title>dgb</Title>
                    <CoinLogoInline network="dgb" />
                </Col>
                <Col>
                    <Title>doge</Title>
                    <CoinLogoInline network="doge" />
                </Col>
                <Col>
                    <Title>etc</Title>
                    <CoinLogoInline network="etc" />
                </Col>
                <Col>
                    <Title>eth</Title>
                    <CoinLogoInline network="eth" />
                </Col>
                <Col>
                    <Title>ltc</Title>
                    <CoinLogoInline network="ltc" />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Title>nem</Title>
                    <CoinLogoInline network="nem" />
                </Col>
                <Col>
                    <Title>nmc</Title>
                    <CoinLogoInline network="nmc" />
                </Col>
                <Col>
                    <Title>rinkeby</Title>
                    <CoinLogoInline network="rinkeby" />
                </Col>
                <Col>
                    <Title>trop</Title>
                    <CoinLogoInline network="trop" />
                </Col>
                <Col>
                    <Title>txrp</Title>
                    <CoinLogoInline network="txrp" />
                </Col>
                <Col>
                    <Title>vtc</Title>
                    <CoinLogoInline network="vtc" />
                </Col>
                <Col>
                    <Title>xem</Title>
                    <CoinLogoInline network="xem" />
                </Col>
                <Col>
                    <Title>xlm</Title>
                    <CoinLogoInline network="xlm" />
                </Col>
                <Col>
                    <Title>xrp</Title>
                    <CoinLogoInline network="xrp" />
                </Col>
                <Col>
                    <Title>zec</Title>
                    <CoinLogoInline network="zec" />
                </Col>
            </Row>
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
        () => (
            <CoinLogo
                network={select(
                    'Coin',
                    {
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
                    },
                    'ada'
                )}
            />
        ),
        {
            info: {
                text: `
            ## Import

            ~~~js
            Import { CoinLogo } from 'trezor-ui-components';
            ~~~

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
                {
                    TOP: icons.TOP,
                    EYE_CROSSED: icons.EYE_CROSSED,
                    EYE: icons.EYE,
                    CHECKED: icons.CHECKED,
                    BACK: icons.BACK,
                    HELP: icons.HELP,
                    REFRESH: icons.REFRESH,
                    T1: icons.T1,
                    COG: icons.COG,
                    EJECT: icons.EJECT,
                    CLOSE: icons.CLOSE,
                    DOWNLOAD: icons.DOWNLOAD,
                    PLUS: icons.PLUS,
                    ARROW_UP: icons.ARROW_UP,
                    ARROW_LEFT: icons.ARROW_LEFT,
                    ARROW_DOWN: icons.ARROW_DOWN,
                    CHAT: icons.CHAT,
                    SKIP: icons.SKIP,
                    WARNING: icons.WARNING,
                    INFO: icons.INFO,
                    ERROR: icons.ERROR,
                    SUCCESS: icons.SUCCESS,
                    WALLET_STANDARD: icons.WALLET_STANDARD,
                    WALLET_HIDDEN: icons.WALLET_HIDDEN,
                    MENU: icons.MENU,
                    QRCODE: icons.QRCODE,
                },
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
    );
