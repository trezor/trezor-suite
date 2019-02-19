import CoinLogo from 'components/images/CoinLogo';
import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { withInfo } from '@storybook/addon-info';
import {
    withKnobs, select,
} from '@storybook/addon-knobs';

import colors from 'config/colors';

const Wrapper = styled.div``;

Wrapper.displayName = 'Wrapper';

storiesOf('Other', module)
    .addDecorator(
        withInfo({
            header: false,
            inline: true,
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
        }),
    )
    .addDecorator(withKnobs)
    .add('Coins', () => (
        <CoinLogo network={select('Coin', {
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
        }, 'ada')}
        />
    ), {
        info: {
            text: `
            ## Import

            ~~~js
            Import { CoinLogo } from 'trezor-ui-components';
            ~~~

            `,
        },
    });
