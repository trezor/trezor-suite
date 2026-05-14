import { useState } from 'react';

import { type Localization } from '@suite-common/suite-types';
import { Collapsible, InfoItem, TextButton } from '@trezor/components';

type MessageSystemManagerTranslationsProps = {
    messages: Localization;
};

export const MessageSystemManagerTranslations = ({
    messages,
}: MessageSystemManagerTranslationsProps) => {
    const [showAll, setShowAll] = useState(false);

    const handleToggle = () => setShowAll(prev => !prev);

    return (
        <Collapsible gap={0}>
            <InfoItem
                labelWidth="100%"
                label={
                    <Collapsible.Toggle>
                        <TextButton
                            iconRight={showAll ? 'caretUpFilled' : 'caretDownFilled'}
                            intent="neutral"
                            onClick={handleToggle}
                        >
                            Translations ({Object.keys(messages).length}){' '}
                        </TextButton>
                    </Collapsible.Toggle>
                }
                intent="neutral"
                priority="secondary"
                iconName="translate"
            >
                <div>
                    <div key="en">
                        <strong>en:</strong> {messages.en}
                    </div>

                    <Collapsible.Content>
                        {Object.entries(messages)
                            .filter(([lang]) => lang !== 'en')
                            .map(([lang, text]) => (
                                <div key={lang}>
                                    <strong>{lang}:</strong> {text}
                                </div>
                            ))}
                    </Collapsible.Content>
                </div>
            </InfoItem>
        </Collapsible>
    );
};
