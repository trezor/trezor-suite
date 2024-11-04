import { useTranslate } from '@suite-native/intl';
import {
    CloseActionType,
    ScreenSubHeader,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type AccountImportSubHeaderProps = {
    closeActionType?: CloseActionType;
};

export const AccountImportSubHeader = ({
    closeActionType = 'close',
}: AccountImportSubHeaderProps) => {
    const { translate } = useTranslate();
    const navigateToInitialScreen = useNavigateToInitialScreen();

    return (
        <ScreenSubHeader
            customHorizontalPadding="sp16"
            closeActionType={closeActionType}
            closeAction={closeActionType === 'close' ? navigateToInitialScreen : undefined}
            content={translate('moduleAccountImport.title')}
        />
    );
};
