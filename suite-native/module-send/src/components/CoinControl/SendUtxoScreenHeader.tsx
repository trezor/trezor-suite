import { type AccountKey } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { IconButton } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';

import { useUtxoSelection } from '../../hooks/useUtxoSelection';

type SendUtxoScreenHeaderProps = {
    accountKey: AccountKey;
    onDelete?: () => void;
};

export const SendUtxoScreenHeader = ({ onDelete, accountKey }: SendUtxoScreenHeaderProps) => {
    const { selectedUtxos, setSelectedUtxos } = useUtxoSelection(accountKey);
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
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
        });
    };

    return (
        <ScreenHeader
            title={translate('moduleSend.coinControl.title')}
            closeActionType="close"
            rightIcon={
                selectedUtxos.length > 0 && (
                    <IconButton
                        iconName="trash"
                        intent="critical"
                        priority="secondary"
                        onPress={handleDelete}
                        testID="coin-control-delete-button"
                    />
                )
            }
        />
    );
};
