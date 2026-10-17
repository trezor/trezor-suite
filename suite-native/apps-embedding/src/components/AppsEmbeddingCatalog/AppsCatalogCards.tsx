import { APPS_EMBEDDING_CATALOG, getPlatformSpecificEntry } from '@suite-common/apps-embedding';
import { Button, Card, Text, VStack } from '@suite-native/atoms';

type AppsCatalogCardsProps = {
    selectedEntryId: string | undefined;
    onSelect: (entryId: string) => void;
};

export const AppsCatalogCards = ({ selectedEntryId, onSelect }: AppsCatalogCardsProps) => (
    <VStack spacing="sp12">
        {APPS_EMBEDDING_CATALOG.map(entry => (
            <Card key={entry.id}>
                <VStack spacing="sp8">
                    <Text variant="body-md-strong">{entry.name}</Text>
                    <Text variant="body-sm">{entry.description}</Text>
                    <Text variant="body-xs" color="contentSecondary">
                        Mobile: {getPlatformSpecificEntry(entry, 'mobile')?.expectedBehavior}
                    </Text>
                    <Button
                        size="small"
                        intent="neutral"
                        priority={selectedEntryId === entry.id ? 'primary' : 'secondary'}
                        onPress={() => onSelect(entry.id)}
                        testID={`@dev-utils/apps-embedding/embed/${entry.id}`}
                    >
                        Open
                    </Button>
                </VStack>
            </Card>
        ))}
    </VStack>
);
