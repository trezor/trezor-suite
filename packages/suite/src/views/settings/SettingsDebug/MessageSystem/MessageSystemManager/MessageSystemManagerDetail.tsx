import styled from 'styled-components';

import { toCommaSeparated } from '@suite-common/message-system';
import { Action } from '@suite-common/suite-types';
import { InfoItem } from '@trezor/components';

import { MessageSystemManagerTranslations } from './MessageSystemManagerTranslations';

const StyledList = styled.ul`
    list-style: none;
`;

type MessageSystemManagerDetailProps = {
    message: Action['message'];
};

export const MessageSystemManagerDetail = ({ message }: MessageSystemManagerDetailProps) => (
    <>
        <InfoItem label={message.id} typographyStyle="highlight" iconName="note" variant="default">
            <MessageSystemManagerTranslations messages={message.content} />
        </InfoItem>
        {message.context && (
            <InfoItem
                label="Context"
                iconName="codeBlockFilled"
                typographyStyle="highlight"
                variant="default"
            >
                {toCommaSeparated(message.context.domain)}
            </InfoItem>
        )}
        {message.feature && (
            <InfoItem
                label="Features"
                iconName="checkFat"
                typographyStyle="highlight"
                variant="default"
            >
                <StyledList>
                    {message.feature.map(feature => (
                        <li key={feature.domain}>
                            <strong>{feature.domain}:</strong>{' '}
                            {feature.flag ? 'enabled' : 'disabled'}
                        </li>
                    ))}
                </StyledList>
            </InfoItem>
        )}
        {message.cta && (
            <InfoItem
                label="CTA"
                iconName="cursorClick"
                typographyStyle="highlight"
                variant="default"
            >
                <div>
                    <MessageSystemManagerTranslations messages={message.cta.label} />
                    <div>
                        <strong>{message.cta.action}:</strong> {message.cta.link}
                    </div>
                </div>
            </InfoItem>
        )}
    </>
);
