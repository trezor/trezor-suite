import { APPS_EMBEDDING_CATALOG, getPlatformSpecificEntry } from '@suite-common/apps-embedding';
import { Button, Card, Column, Row, Text } from '@trezor/components';

type AppsCatalogProps = {
    selectedEntryId: string | undefined;
    onSelect: (entryId: string) => void;
};

export const AppsCatalog = ({ selectedEntryId, onSelect }: AppsCatalogProps) => (
    <Column gap={12}>
        {APPS_EMBEDDING_CATALOG.map(entry => (
            <Card key={entry.id}>
                <Column gap={8}>
                    <Row justifyContent="space-between" gap={16}>
                        <Column gap={2}>
                            <Text typographyStyle="body-md-strong">{entry.name}</Text>
                            <Text intent="neutral" priority="secondary">
                                {entry.description}
                            </Text>
                        </Column>
                        <Row gap={8} alignItems="flex-start">
                            {/* TODO: next PR - "Forget data" for persistent sessions. */}
                            <Button
                                size="small"
                                intent="brand"
                                priority={selectedEntryId === entry.id ? 'primary' : 'secondary'}
                                onClick={() => onSelect(entry.id)}
                                data-testid={`@settings/apps-embedding/embed/${entry.id}`}
                            >
                                Embed
                            </Button>
                        </Row>
                    </Row>
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        Web: {getPlatformSpecificEntry(entry, 'web')?.expectedBehavior}
                    </Text>
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        Desktop: {getPlatformSpecificEntry(entry, 'desktop')?.expectedBehavior}
                    </Text>
                </Column>
            </Card>
        ))}
    </Column>
);
