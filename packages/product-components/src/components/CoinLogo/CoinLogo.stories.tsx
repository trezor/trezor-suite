import { type Meta, type StoryObj } from '@storybook/react';

import { isCryptoIconSymbol, networkIconSymbolMap } from '@suite-common/icons/src/iconUtils';
import { networksCollection } from '@suite-common/wallet-config';
import { Column, Grid, H2, Paragraph } from '@trezor/components';
import { typedObjectKeys } from '@trezor/utils';

import {
    COIN_LOGO_TYPE,
    CoinLogo,
    type CoinLogoProps,
    type CoinLogoSize,
    type CoinLogoType,
    allowedCoinLogoSizes,
} from './CoinLogo';

const NETWORK_ICON_SYMBOLS = typedObjectKeys(networkIconSymbolMap);
const TOKEN_WITH_NETWORK_SYMBOLS = networksCollection
    .filter(network => network.settlementLayer)
    .map(network => network.symbol)
    .filter(isCryptoIconSymbol);

type CoinLogoGallerySectionProps = {
    heading: string;
    symbols: readonly CoinLogoProps['symbol'][];
    type?: CoinLogoType;
    size?: CoinLogoSize;
};

const CoinLogoGallerySection = ({
    heading,
    symbols,
    type = 'token',
    size = 40,
}: CoinLogoGallerySectionProps) => (
    <Column gap={16}>
        <H2 align="center" typographyStyle="headline-sm">
            {heading}
        </H2>
        <Grid
            columns="repeat(auto-fit, minmax(120px, 1fr))"
            columnGap={16}
            rowGap={48}
            padding={{ vertical: 32 }}
        >
            {symbols.map(symbol => (
                <Column key={symbol} justifyContent="center" alignItems="center" gap={12}>
                    <CoinLogo symbol={symbol} type={type} size={size} />
                    <Paragraph intent="neutral" priority="secondary" isMonospaced>
                        {symbol}
                    </Paragraph>
                </Column>
            ))}
        </Grid>
    </Column>
);

const meta: Meta<typeof CoinLogo> = {
    title: 'CoinLogo',
    component: CoinLogo,
};
export default meta;

export const All: StoryObj = {
    render: () => (
        <Column gap={48}>
            <CoinLogoGallerySection heading="Token" symbols={NETWORK_ICON_SYMBOLS} />
            <CoinLogoGallerySection
                heading="Network"
                symbols={NETWORK_ICON_SYMBOLS}
                type="network"
            />
            <CoinLogoGallerySection
                heading="Token with network"
                symbols={TOKEN_WITH_NETWORK_SYMBOLS}
                type="tokenWithNetwork"
            />
        </Column>
    ),
};

export const Single: StoryObj<CoinLogoProps> = {
    args: {
        symbol: 'base',
        type: 'tokenWithNetwork',
        size: 64,
    },
    argTypes: {
        size: {
            options: allowedCoinLogoSizes,
            control: { type: 'select' },
        },
        symbol: {
            options: NETWORK_ICON_SYMBOLS,
            control: {
                type: 'select',
            },
        },
        type: {
            options: COIN_LOGO_TYPE,
            control: {
                type: 'select',
            },
        },
    },
};
