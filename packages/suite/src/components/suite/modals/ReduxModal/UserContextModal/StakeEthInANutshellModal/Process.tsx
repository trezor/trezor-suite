import { Badge, Column, Icon, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { useState } from 'react';

interface ProcessProps {
    heading: React.ReactNode;
    badge: React.ReactNode;
    content: React.ReactNode;
}

export const Process = ({ heading, badge, content }: ProcessProps) => {
    const [isContentVisible, setContentVisibility] = useState(false);

    const toggleContentVisibility = () => {
        setContentVisibility(!isContentVisible);
    };

    return (
        <Column gap={spacings.md} justifyContent="flex-start" alignItems="normal">
            <Row justifyContent="space-between">
                <Row gap={spacings.xxs}>
                    <Paragraph typographyStyle="body" variant="tertiary">
                        {heading}
                    </Paragraph>
                    <Badge size="tiny">{badge}</Badge>
                </Row>
                <Icon
                    size={20}
                    name={isContentVisible ? 'caretCircleUp' : 'caretCircleDown'}
                    onClick={toggleContentVisibility}
                />
            </Row>
            {isContentVisible && content}
        </Column>
    );
};
