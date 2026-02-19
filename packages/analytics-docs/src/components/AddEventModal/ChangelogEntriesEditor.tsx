import { Button, Column, IconButton, Input, Row, Text } from '@trezor/components';

import { CHANGELOG_ERROR_MESSAGES, defaultChangelogEntry } from './constants';
import type { EventFormChangelogEntry } from '../../utils/eventFileUtils';
import { isValidAppVersion } from '../../utils/eventFileUtils';

export const ChangelogEntriesEditor = ({
    entries,
    onChange,
    label,
    errorType,
}: {
    entries: EventFormChangelogEntry[];
    onChange: (entries: EventFormChangelogEntry[]) => void;
    label: string;
    errorType?: 'no_entry' | 'invalid_version' | 'empty_notes' | null;
}) => (
    <Column gap={8}>
        <Text typographyStyle="label">{label}</Text>
        {entries.map((entry, idx) => (
            <Row key={idx} gap={8} alignItems="flex-start">
                <Input
                    size="small"
                    labelLeft="Version"
                    value={entry.version}
                    onChange={e => {
                        const next = [...entries];
                        next[idx] = { ...next[idx], version: e.target.value };
                        onChange(next);
                    }}
                    placeholder="26.2.0 nebo ?"
                    hasError={entry.version.trim() !== '' && !isValidAppVersion(entry.version)}
                />
                <Input
                    size="small"
                    labelLeft="Notes"
                    value={entry.notes}
                    onChange={e => {
                        const next = [...entries];
                        next[idx] = { ...next[idx], notes: e.target.value };
                        onChange(next);
                    }}
                    placeholder="např. added"
                />
                <IconButton
                    icon="trash"
                    size="small"
                    intent="neutral"
                    onClick={() => onChange(entries.filter((_, i) => i !== idx))}
                    aria-label="Remove entry"
                />
            </Row>
        ))}
        {errorType && (
            <Text typographyStyle="hint" intent="critical">
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
