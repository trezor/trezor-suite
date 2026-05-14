import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { ALL_URLS } from '@trezor/urls';

import { TrezorLink } from 'src/components/suite/TrezorLink';

interface ReadMoreLinkProps {
    url: keyof Omit<typeof ALL_URLS, 'TOR_URLS' | 'SUITE_TRADING_REDIRECT_DEEPLINKS'>;
    linkLabel?: ExtendedMessageDescriptor['id'];
    message?: ExtendedMessageDescriptor['id'];
}

// common component used in various places
// displays Translation with TR_LEARN_MORE value (Link) or standalone Link
export const ReadMoreLink = ({ url, message, linkLabel }: ReadMoreLinkProps) =>
    message ? (
        <Translation
            id={message}
            values={{
                TR_LEARN_MORE: (
                    <TrezorLink href={ALL_URLS[url]}>
                        <Translation id={linkLabel || 'TR_LEARN_MORE'} />
                    </TrezorLink>
                ),
            }}
        />
    ) : (
        <TrezorLink href={ALL_URLS[url]}>
            <Translation id={linkLabel || 'TR_LEARN_MORE'} />
        </TrezorLink>
    );
