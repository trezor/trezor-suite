import { Fragment, type ReactNode } from 'react';

import { extractUrlsFromText } from '@trezor/utils';

import { BlurWrapper } from './BlurWrapper';
import { Tooltip } from '../Tooltip/Tooltip';

export type BlurUrlsProps = {
    text?: string;
    tooltipContent: ReactNode;
};

export const BlurUrls = ({ text, tooltipContent }: BlurUrlsProps) => {
    if (!text) return null;

    const { textParts, urls } = extractUrlsFromText(text);

    return textParts.map((part, index) => (
        <Fragment key={index}>
            {part}
            {index < urls.length && (
                <Tooltip display="inline-block" content={tooltipContent}>
                    <BlurWrapper $isBlurred>{urls[index]}</BlurWrapper>
                </Tooltip>
            )}
        </Fragment>
    ));
};
