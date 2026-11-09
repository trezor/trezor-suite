import { APPS_EMBEDDING_CATALOG } from '@suite-common/apps-embedding';
import { VStack } from '@suite-native/atoms';

import { AppsCatalogCard } from './AppsCatalogCard';

type AppsCatalogCardsProps = {
    selectedEntryId: string | undefined;
    onSelect: (entryId: string) => void;
};

export const AppsCatalogCards = ({ selectedEntryId, onSelect }: AppsCatalogCardsProps) => (
    <VStack spacing="sp12">
        {APPS_EMBEDDING_CATALOG.map(entry => (
            <AppsCatalogCard
                key={entry.id}
                entry={entry}
                isSelected={selectedEntryId === entry.id}
                onSelect={onSelect}
            />
        ))}
    </VStack>
);
