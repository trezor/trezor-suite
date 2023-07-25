import React from 'react';
import styled from 'styled-components';
import { Tooltip, Link } from '@trezor/components';

const StyledLink = styled(Link)`
    font-size: 10px;

    &:hover {
        text-decoration: underline;
    }
`;

const MessageWrapper = styled.span`
    text-decoration: underline solid red;
`;

export interface HelperTooltipProps {
    messageId?: string;
    isNested?: boolean;
    language?: string;
    translationMode?: boolean;
    children: any;
}

/**
 * When translationMode is enabled wraps a message with a Tooltip and adds styling to provide visual hint for translators
 */
const HelperTooltip = ({
    messageId,
    isNested,
    language,
    translationMode,
    children,
}: HelperTooltipProps) => {
    const locale = language?.replace('-', '') || 'en';
    // don't wrap with tooltip for messages that are nested in another message
    // fixes https://github.com/trezor/trezor-suite/issues/1509
    return translationMode && !isNested ? (
        <Tooltip
            placement="bottom"
            content={
                <StyledLink
                    variant="nostyle"
                    href={`https://crowdin.com/translate/trezor-suite/99/en-${locale}#q=${messageId}`}
                >
                    {messageId}
                </StyledLink>
            }
        >
            <MessageWrapper>{children}</MessageWrapper>
        </Tooltip>
    ) : (
        children
    );
};

export default HelperTooltip;
