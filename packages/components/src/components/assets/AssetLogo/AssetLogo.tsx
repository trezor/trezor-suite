import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { COINS } from './coins';
import { DefaultAssetLogo } from '../DefaultAssetLogo/DefaultAssetLogo';
import { spacingsPx } from '@trezor/theme';
import { SkeletonCircle } from '../../skeletons/SkeletonCircle';
import { getRightLogoSizeUsedWithUrl } from '../utils';

export type CoinType = keyof typeof COINS;

const UPDATED_ICONS_LIST_URL_BASE = 'https://data.trezor.io/suite/icons/coins/';

export type AssetLogoSize = 16 | 24 | 32 | 48;

const useCheckUrlAccessibility = (url: string) => {
    const [isAccessible, setIsAccessible] = useState(false);

    useEffect(() => {
        const checkAccessibility = async () => {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                setIsAccessible(response.ok);
            } catch (error) {
                console.error('Error checking URL accessibility:', error);
                setIsAccessible(false);
            }
        };

        if (url) {
            checkAccessibility();
        }
    }, [url]);

    return isAccessible;
};

export const useAssetUrl = (coingeckoId: string, contractAddress?: string) => {
    const fileName = contractAddress ? `${coingeckoId}_${contractAddress}` : coingeckoId;
    const assetUrl = fileName ? `${UPDATED_ICONS_LIST_URL_BASE}${fileName}@2x.webp` : '';
    const isAssetUrlAccessible = useCheckUrlAccessibility(assetUrl);
    const iconUrl = fileName && isAssetUrlAccessible ? assetUrl : undefined;

    return iconUrl;
};

export interface AssetLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol?: CoinType;
    className?: string;
    size?: AssetLogoSize;
    index?: number;
    coingeckoId?: string;
    contractAddress?: string;
}

const Wrapper = styled.div<{ $size: number }>`
    display: inline-block;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    margin: ${spacingsPx.xxs};

    div {
        width: ${({ $size }) => $size}px;
        height: ${({ $size }) => $size}px;
        line-height: ${({ $size }) => $size}px;
    }
`;

const StyledIconImage = styled.img<{ $size: number }>(
    ({ $size }) => `
        width: ${$size}px;
        height: ${$size}px;
    `,
);

type SVGCoinLogoProps = {
    $symbol: CoinType;
    $size?: number;
};

const SVGCoinLogo = ({ $symbol, $size = 32 }: SVGCoinLogoProps) => (
    <ReactSVG
        src={$symbol}
        beforeInjection={svg => {
            svg.setAttribute('width', `${$size}px`);
            svg.setAttribute('height', `${$size}px`);
        }}
    />
);

export const AssetLogo = ({
    symbol,
    className,
    size = 32,
    coingeckoId = '',
    contractAddress,
    ...rest
}: AssetLogoProps) => {
    const [isLoading, setIsLoading] = useState(true);

    const iconUrl = useAssetUrl(coingeckoId, contractAddress);
    const assetLogoSize = symbol ? size : getRightLogoSizeUsedWithUrl(size); // we need to use smaller sizes if not used with symbol
    const firstCharacter = coingeckoId?.[0]?.toUpperCase();

    const hideLoading = () => setIsLoading(false);

    const logo = iconUrl ? (
        <>
            {isLoading && <SkeletonCircle size={assetLogoSize} />}
            <StyledIconImage
                src={iconUrl}
                $size={assetLogoSize}
                onLoad={hideLoading}
                onError={hideLoading}
                {...rest}
            />
        </>
    ) : (
        <DefaultAssetLogo size={assetLogoSize} coinFirstCharacter={firstCharacter} />
    );

    return (
        <Wrapper className={className} $size={assetLogoSize} {...rest}>
            {symbol ? <SVGCoinLogo $symbol={COINS[symbol]} $size={assetLogoSize} /> : logo}
        </Wrapper>
    );
};
