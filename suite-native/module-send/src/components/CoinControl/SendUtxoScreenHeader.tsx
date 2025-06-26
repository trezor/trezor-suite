import { useAlert } from '@suite-native/alerts';
import { IconButton } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

import { useUtxoSelection } from '../../hooks/useUtxoSelection';

type SendUtxoScreenHeaderProps = {
    onDelete?: () => void;
};

export const SendUtxoScreenHeader = ({ onDelete }: SendUtxoScreenHeaderProps) => {
    const { selectedUtxos, setSelectedUtxos } = useUtxoSelection();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();

    const handleDelete = () => {
        showAlert({
            title: translate('moduleSend.coinControl.disable.title'),
            description: translate('moduleSend.coinControl.disable.description'),
            primaryButtonTitle: translate('moduleSend.coinControl.disable.primaryButton'),
            secondaryButtonTitle: translate('moduleSend.coinControl.disable.secondaryButton'),
            onPressPrimaryButton: () => {
                setSelectedUtxos([]);
                onDelete?.();
            },
            primaryButtonVariant: 'redBold',
            secondaryButtonVariant: 'redElevation0',
        });
    };

    return (
        <ScreenHeader
            content={translate('moduleSend.coinControl.title')}
            closeActionType="close"
            rightIcon={
                selectedUtxos.length > 0 && (
                    <IconButton
                        iconName="trash"
                        colorScheme="redElevation0"
                        size="medium"
                        onPress={handleDelete}
                        testID="coin-control-delete-button"
                    />
                )
            }
        />
    );
};
