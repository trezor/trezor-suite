import { useAtom, useSetAtom } from 'jotai';

import { IconButton, Text } from '@suite-native/atoms';
import { GoBackIcon, ScreenHeader } from '@suite-native/navigation';

import { coinControlEnabledAtom, selectedUtxosAtom } from '../atoms/coinControlAtoms';

export const CoinControlScreenHeader = () => {
    const [selectedUtxos] = useAtom(selectedUtxosAtom);
    const setCoinControlEnabled = useSetAtom(coinControlEnabledAtom);
    const setSelectedUtxos = useSetAtom(selectedUtxosAtom);

    const handleDelete = () => {
        // TODO should open a bottom sheet confirmation
        setSelectedUtxos([]);
        setCoinControlEnabled(false);
    };

    return (
        <ScreenHeader
            content={<Text>Coin Control</Text>}
            leftIcon={<GoBackIcon closeActionType="close" />}
            rightIcon={
                selectedUtxos.length > 0 && (
                    <IconButton
                        iconName="trash"
                        colorScheme="redElevation0"
                        size="medium"
                        onPress={handleDelete}
                    />
                )
            }
        />
    );
};
