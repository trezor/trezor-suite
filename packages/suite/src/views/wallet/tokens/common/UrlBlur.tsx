import { Fragment } from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';

import { BlurWrapper } from 'src/components/wallet/TransactionItem/TransactionItemBlurWrapper';
import { Translation } from 'src/components/suite';

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;

interface BlurUrlsProps {
    text?: string;
}

export const BlurUrls = ({ text }: BlurUrlsProps) => {
    if (!text) return null;

    const urlRegex =
        /\b(?:https?:\/\/|www\.)[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+(?:\.[a-zA-Z]{2,})\b|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/gi;

    const parts = text.split(urlRegex);
    const matches = [...text.matchAll(urlRegex)];

    return parts.map((part, index) => (
        <Fragment key={index}>
            {part}
            {matches[index] && (
                <StyledTooltip content={<Translation id="TR_URL_IN_TOKEN" />}>
                    <BlurWrapper $isBlurred>{matches[index][0]}</BlurWrapper>
                </StyledTooltip>
            )}
        </Fragment>
    ));
};
