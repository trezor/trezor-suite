import styled from 'styled-components';

import { toCommaSeparated } from '@suite-common/message-system';
import { type Action } from '@suite-common/suite-types';
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
        <InfoItem
            label={message.id}
            typographyStyle="body-md-strong"
            iconName="note"
            intent="neutral"
            priority="primary"
        >
            <MessageSystemManagerTranslations messages={message.content} />
        </InfoItem>
        {message.context && (
            <InfoItem
                label="Context"
                iconName="codeBlockFilled"
                typographyStyle="body-md-strong"
                intent="neutral"
                priority="primary"
            >
                {toCommaSeparated(message.context.domain)}
            </InfoItem>
        )}
        {message.feature && (
            <InfoItem
                label="Features"
                iconName="checkFat"
                typographyStyle="body-md-strong"
                intent="neutral"
                priority="primary"
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
                typographyStyle="body-md-strong"
                intent="neutral"
                priority="primary"
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
