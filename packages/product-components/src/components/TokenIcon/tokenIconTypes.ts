import { type FrameProps, type FramePropsKeys } from '@trezor/components';

export const allowedTokenIconSizes = [16, 20, 24, 32, 40, 48, 64] as const;
export type TokenIconSize = (typeof allowedTokenIconSizes)[number];

export const allowedTokenIconFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedFrameProps = Pick<FrameProps, (typeof allowedTokenIconFrameProps)[number]>;

export interface TokenIconProps extends AllowedFrameProps {
    symbol: string;
    coingeckoId?: string;
    contractAddresses?: readonly string[];
    size?: TokenIconSize;
    showNetworkIcon?: boolean;
    shouldTryToFetch?: boolean;
    placeholderWithTooltip?: boolean;
    placeholder?: string;
    'data-testid'?: string;
    customLogoUrl?: string;
    isBordered?: boolean;
    isTransparent?: boolean;
}
