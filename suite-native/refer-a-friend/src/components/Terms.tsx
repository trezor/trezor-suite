import { type ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { DATA_PRIVACY_URL, TREZOR_TOS_REFER_A_FRIEND_URL, TREZOR_TOS_URL } from '@trezor/urls';

type TermsLinkProps = {
    href: string;
    label: ReactNode;
};

const TermsLink = ({ href, label }: TermsLinkProps) => (
    <Link
        href={href}
        label={label}
        textVariant="body-sm"
        textColor="contentTertiary"
        isUnderlined
    />
);

export const Terms = () => (
    <Box paddingBottom="sp8">
        <Text variant="body-sm" color="contentTertiary" textAlign="center">
            <Translation
                id="referAFriend.terms"
                values={{
                    privacyPolicy: chunks => <TermsLink href={DATA_PRIVACY_URL} label={chunks} />,
                    programTerms: chunks => (
                        <TermsLink href={TREZOR_TOS_REFER_A_FRIEND_URL} label={chunks} />
                    ),
                    generalTerms: chunks => <TermsLink href={TREZOR_TOS_URL} label={chunks} />,
                }}
            />
        </Text>
    </Box>
);
