import { Translation } from '@suite-native/intl';
import {
    type CloseActionType,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type AccountImportScreenHeaderProps = {
    closeActionType?: CloseActionType;
};

export const AccountImportScreenHeader = ({
    closeActionType = 'close',
}: AccountImportScreenHeaderProps) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    return (
        <ScreenHeader
            closeActionType={closeActionType}
            closeAction={closeActionType === 'close' ? navigateToInitialScreen : undefined}
            title={<Translation id="moduleAccountImport.title" />}
        />
    );
};
