import { type JSX } from 'react';

import { CoinsIcon, PictureFrameIcon } from '@trezor/icons';

import { AccountExceptionLayout } from 'src/components/wallet';

interface NoTokensProps {
    title: JSX.Element | string;
    isNft?: boolean;
    'data-testid'?: string;
}

export const NoTokens = ({ title, isNft, 'data-testid': dataTestId }: NoTokensProps) => (
    <AccountExceptionLayout
        title={title}
        data-testid={dataTestId}
        icon={isNft ? PictureFrameIcon : CoinsIcon}
        iconVariant="neutral"
    />
);
