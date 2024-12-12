import { AccountExceptionLayout } from 'src/components/wallet';

interface NoTokensProps {
    title: JSX.Element | string;
    isNft?: boolean;
}

export const NoTokens = ({ title, isNft }: NoTokensProps) => (
    <AccountExceptionLayout
        title={title}
        iconName={isNft ? 'pictureFrame' : 'coins'}
        iconVariant="tertiary"
    />
);
