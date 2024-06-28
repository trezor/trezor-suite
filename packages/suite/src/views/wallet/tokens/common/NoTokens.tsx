import { AccountExceptionLayout } from 'src/components/wallet';

interface NoTokensProps {
    title: JSX.Element | string;
}

export const NoTokens = ({ title }: NoTokensProps) => (
    <AccountExceptionLayout title={title} image="CLOUDY" />
);
