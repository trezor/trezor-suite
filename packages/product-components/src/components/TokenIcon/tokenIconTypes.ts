import { type FrameProps, type FramePropsKeys } from '@trezor/components';

import { type NetworkIconProps } from '../NetworkIcon/NetworkIcon';

export const allowedTokenIconSizes = [16, 20, 24, 32, 40, 48, 64] as const;
export type TokenIconSize = (typeof allowedTokenIconSizes)[number];

export const allowedTokenIconFrameProps = ['margin'] as const satisfies FramePropsKeys[];
export type AllowedFrameProps = Pick<FrameProps, (typeof allowedTokenIconFrameProps)[number]>;

export type TokenIconSource = { src: string; srcSet?: string };

export interface TokenIconProps extends AllowedFrameProps {
    src?: string;
    sources?: readonly TokenIconSource[];
    badge?: Omit<NetworkIconProps, 'size'>;
    size?: TokenIconSize;
    shouldTryToFetch?: boolean;
    placeholderWithTooltip?: boolean;
    placeholder?: string;
    'data-testid'?: string;
    isBordered?: boolean;
    isTransparent?: boolean;
}
