import styled from 'styled-components';

import { CONTEXT_PATTERNS, FEATURE_LIST } from '@suite-common/message-system';
import { Button, Card, IconButton, Popover, Row, Tooltip } from '@trezor/components';
import { spacings, zIndices } from '@trezor/theme';

import { MessageSystemInfo } from '../MessageSystemInfo';

const ScrollContainer = styled.div`
    overflow-y: auto;
    max-height: 90vh;
`;

export const MessageSystemInfoButtons = () => (
    <Row gap={spacings.xs}>
        <Tooltip
            content={
                <div>
                    {Object.values(CONTEXT_PATTERNS)
                        .sort((a, b) => a.pattern.localeCompare(b.pattern))
                        .map(pattern => (
                            <div key={pattern.pattern}>{pattern.pattern}</div>
                        ))}
                </div>
            }
        >
            <Button size="small" icon="codeBlockFilled" variant="tertiary">
                Context patterns
            </Button>
        </Tooltip>

        <Tooltip
            content={
                <div>
                    {FEATURE_LIST.map(feature => (
                        <div key={feature}>{feature}</div>
                    ))}
                </div>
            }
        >
            <Button size="small" icon="checkFat" variant="tertiary">
                Feature list
            </Button>
        </Tooltip>

        <Popover
            content={
                <Card>
                    <ScrollContainer>
                        <MessageSystemInfo />
                    </ScrollContainer>
                </Card>
            }
            zIndex={zIndices.tooltip}
        >
            <IconButton icon="question" size="small" variant="tertiary" />
        </Popover>
    </Row>
);
