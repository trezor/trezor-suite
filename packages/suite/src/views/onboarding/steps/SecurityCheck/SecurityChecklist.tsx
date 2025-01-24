import { Box, Column, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SecurityChecklistItem } from './types';

type SecurityChecklistProps = {
    items: readonly SecurityChecklistItem[];
};

export const SecurityChecklist = ({ items }: SecurityChecklistProps) => (
    <Column
        alignItems="flex-start"
        gap={spacings.xl}
        margin={{ top: spacings.xl, bottom: spacings.xxxxl }}
    >
        {items.map((item, index) => (
            <Row key={index} gap={spacings.xl}>
                {item.icon}
                <Box>
                    <Paragraph variant="tertiary">{item.content}</Paragraph>
                    {item.subtitle ? (
                        <Paragraph typographyStyle="hint" variant="tertiary">
                            {item.subtitle}
                        </Paragraph>
                    ) : null}
                </Box>
            </Row>
        ))}
    </Column>
);
