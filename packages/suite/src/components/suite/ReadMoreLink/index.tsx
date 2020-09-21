import React from 'react';
import { Link } from '@trezor/components';
import { Translation } from '@suite-components';
import { URLS } from '@suite-constants';
import { ExtendedMessageDescriptor } from '@suite-types';

interface Props {
    url: keyof typeof URLS;
    linkLabel?: ExtendedMessageDescriptor['id'];
    message?: ExtendedMessageDescriptor['id'];
}

// common component used in various places
// displays Translation with TR_LEARN_MORE value (Link) or standalone Link
export const ReadMoreLink = ({ url, message, linkLabel }: Props) => {
    return message ? (
        <Translation
            id={message}
            values={{
                TR_LEARN_MORE: (
                    <Link variant="nostyle" href={URLS[url]}>
                        <Translation id={linkLabel || 'TR_LEARN_MORE'} />
                    </Link>
                ),
            }}
        />
    ) : (
        <Link href={URLS[url]}>
            <Translation id={linkLabel || 'TR_LEARN_MORE'} />
        </Link>
    );
};
