import { Fragment } from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components';
import { BlurWrapper } from 'src/components/wallet/TransactionItem/TransactionItemBlurWrapper';
import { Translation } from 'src/components/suite';
import { extractUrlsFromText } from '@trezor/utils';

const StyledTooltip = styled(Tooltip)`
    display: inline-block;
`;

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
                <StyledTooltip content={<Translation id="TR_URL_IN_TOKEN" />}>
                    <BlurWrapper $isBlurred>{urls[index]}</BlurWrapper>
                </StyledTooltip>
            )}
        </Fragment>
    ));
};
