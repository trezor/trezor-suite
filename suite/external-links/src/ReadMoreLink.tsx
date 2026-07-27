import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { ALL_URLS } from '@trezor/urls';

import { TrezorLink } from './TrezorLink';

interface ReadMoreLinkProps {
    url: keyof Omit<typeof ALL_URLS, 'TOR_URLS' | 'SUITE_TRADING_REDIRECT_DEEPLINKS'>;
    linkLabel?: ExtendedMessageDescriptor['id'];
    message?: ExtendedMessageDescriptor['id'];
}

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
