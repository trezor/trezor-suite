import { Box, Card, PictogramTitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const HiddenTokensEmptyState = () => (
    <Box paddingHorizontal="sp16">
        <Card>
            <PictogramTitleHeader
                variant="info"
                icon="coins"
                title={
                    <Translation id="moduleAccountManagement.accountOverviewScreen.hiddenTokensSection.emptyTitle" />
                }
            />
        </Card>
    </Box>
);
