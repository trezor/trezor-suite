import { Box, Spinner } from '@suite-native/atoms';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const EarnLoadingScreen = () => (
    <Screen isScrollable={false} header={<ScreenHeader closeActionType="back" />}>
        <Box flex={1} justifyContent="center" alignItems="center">
            <Spinner loadingState="idle" />
        </Box>
    </Screen>
);
