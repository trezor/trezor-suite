import { Fragment } from 'react';

import { Translation } from '@suite/intl';
import { Tooltip } from '@trezor/components';
import { extractUrlsFromText } from '@trezor/utils';

import { BlurWrapper } from 'src/components/wallet/TransactionItem/TransactionItemBlurWrapper';

interface BlurUrlsProps {
    text?: string;
}

export const BlurUrls = ({ text }: BlurUrlsProps) => {
    if (!text) return null;

    const { textParts, urls } = extractUrlsFromText(text);

    return textParts.map((part, index) => (
        <Fragment key={index}>
            {part}
            {index < urls.length && (
                <Tooltip display="inline-block" content={<Translation id="TR_URL_IN_TOKEN" />}>
                    <BlurWrapper $isBlurred>{urls[index]}</BlurWrapper>
                </Tooltip>
            )}
        </Fragment>
    ));
};
