import { Button, Column, IconButton, Input, Paragraph, Row, Text } from '@trezor/components';

import { CHANGELOG_ERROR_MESSAGES, defaultChangelogEntry } from './constants';
import type { EventFormChangelogEntry } from '../../utils/eventFileUtils';
import { isValidAppVersion } from '../../utils/eventFileUtils';

export const ChangelogEntriesEditor = ({
    entries,
    onChange,
    errorType,
}: {
    entries: EventFormChangelogEntry[];
    onChange: (entries: EventFormChangelogEntry[]) => void;
    errorType?: 'no_entry' | 'invalid_version' | 'empty_notes' | null;
}) => (
    <Column gap={8}>
        <Row gap={8}>
            <Paragraph typographyStyle="body-sm" width={100}>
                Version
            </Paragraph>
            <Text typographyStyle="body-sm">Notes</Text>
        </Row>
        {entries.map((entry, idx) => (
            <Row key={idx} gap={8} alignItems="center">
                <Input
                    size="small"
                    value={entry.version}
                    onChange={e => {
                        const next = [...entries];
                        next[idx] = { ...next[idx], version: e.target.value };
                        onChange(next);
                    }}
                    placeholder="26.2.0 nebo ?"
                    hasError={entry.version.trim() !== '' && !isValidAppVersion(entry.version)}
                    width={100}
                />
                <Input
                    size="small"
                    value={entry.notes}
                    onChange={e => {
                        const next = [...entries];
                        next[idx] = { ...next[idx], notes: e.target.value };
                        onChange(next);
                    }}
                    placeholder="např. added"
                    flex="1"
                />
                <IconButton
                    icon="trash"
                    size="medium"
                    intent="neutral"
                    onClick={() => onChange(entries.filter((_, i) => i !== idx))}
                    aria-label="Remove entry"
                    priority="secondary"
                />
            </Row>
        ))}
        {errorType && (
            <Text typographyStyle="body-sm" intent="critical">
                {CHANGELOG_ERROR_MESSAGES[errorType]}
            </Text>
        )}
        <Button
            size="small"
            intent="neutral"
            priority="secondary"
            iconLeft="plus"
            onClick={() => onChange([...entries, defaultChangelogEntry()])}
        >
            Add changelog entry
        </Button>
    </Column>
);
