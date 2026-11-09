import type { ReactNode } from 'react';

import { CenteredTitleHeader, VStack } from '@suite-native/atoms';

type AssetListEmptyPlaceholderProps = {
    subtitle: ReactNode;
    children?: ReactNode;
};

export const NoResultsPlaceholder = ({ subtitle, children }: AssetListEmptyPlaceholderProps) => (
    <VStack marginTop="sp64" marginHorizontal="sp16" justifyContent="center">
        <CenteredTitleHeader title="No results" titleVariant="headline-sm" subtitle={subtitle} />
        {children}
    </VStack>
);
