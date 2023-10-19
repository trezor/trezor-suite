import * as URLS from '@trezor/urls';
import { Translation, TrezorLink } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';

interface ReadMoreLinkProps {
    url: keyof Omit<typeof URLS, 'TOR_URLS'>;
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
                    <TrezorLink variant="nostyle" href={URLS[url]}>
                        <Translation id={linkLabel || 'TR_LEARN_MORE'} />
                    </TrezorLink>
                ),
            }}
        />
    ) : (
        <TrezorLink href={URLS[url]}>
            <Translation id={linkLabel || 'TR_LEARN_MORE'} />
        </TrezorLink>
    );
