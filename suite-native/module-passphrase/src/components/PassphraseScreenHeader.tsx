import { ScreenHeaderWrapper } from '@suite-native/atoms';
import { GoBackIcon } from '@suite-native/navigation';

export const PassphraseScreenHeader = () => {
    return (
        <ScreenHeaderWrapper>
            <GoBackIcon closeActionType="close" />
        </ScreenHeaderWrapper>
    );
};
