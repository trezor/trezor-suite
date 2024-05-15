import { H3 } from '@trezor/components';

type PassphraseHeadingProps = {
    children: React.ReactNode;
};
export const PassphraseHeading = ({ children }: PassphraseHeadingProps) => (
    <H3 margin={{ bottom: 16, top: 8 }}>{children}</H3>
);
