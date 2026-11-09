import {
    type AppsEmbeddingCatalogEntry,
    getPlatformSpecificEntry,
} from '@suite-common/apps-embedding';
import { Badge, Button, Card, Text, VStack } from '@suite-native/atoms';

type AppsCatalogCardProps = {
    entry: AppsEmbeddingCatalogEntry;
    isSelected: boolean;
    onSelect: (entryId: string) => void;
};

export const AppsCatalogCard = ({ entry, isSelected, onSelect }: AppsCatalogCardProps) => {
    const mobileEntry = getPlatformSpecificEntry(entry, 'mobile');
    const isSessionPersisted = mobileEntry?.persistSession === true;

    return (
        <Card>
            <VStack spacing="sp8">
                <Text variant="body-md-strong">{entry.name}</Text>
                {/* What the entry declares; the mode note above the catalog says where a host
                    cannot honour it (Chrome Custom Tabs persist regardless). */}
                <Badge
                    label={isSessionPersisted ? 'Persistent session' : 'Non-persistent session'}
                    intent={isSessionPersisted ? 'info' : 'neutral'}
                    size="small"
                    alignSelf="flex-start"
                />
                <Text variant="body-sm">{entry.description}</Text>
                <Text variant="body-xs" color="contentSecondary">
                    Mobile: {mobileEntry?.expectedBehavior}
                </Text>
                <Button
                    size="small"
                    intent="neutral"
                    priority={isSelected ? 'primary' : 'secondary'}
                    onPress={() => onSelect(entry.id)}
                    testID={`@dev-utils/apps-embedding/embed/${entry.id}`}
                >
                    Open
                </Button>
            </VStack>
        </Card>
    );
};
