import { useTranslate } from '@suite-native/intl';
import {
    CloseActionType,
    ScreenHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type AccountImportScreenHeaderProps = {
    closeActionType?: CloseActionType;
};

export const AccountImportScreenHeader = ({
    closeActionType = 'close',
}: AccountImportScreenHeaderProps) => {
    const { translate } = useTranslate();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    return (
        <ScreenHeader
            closeActionType={closeActionType}
            closeAction={closeActionType === 'close' ? navigateToInitialScreen : undefined}
            content={translate('moduleAccountImport.title')}
        />
    );
};
