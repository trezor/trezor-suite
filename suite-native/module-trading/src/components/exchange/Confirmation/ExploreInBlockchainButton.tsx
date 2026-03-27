import { Linking } from 'react-native';

import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const ExploreInBlockchainButton = () => {
    const openTransactionInBlockchain = () => {
        // TODO 27125: open transaction in blockchain explorer instead of trezor.io
        Linking.openURL('https://trezor.io/');
    };

    return (
        <Button
            onPress={openTransactionInBlockchain}
            viewRight="arrowUpRight"
            colorScheme="tertiaryElevation0"
        >
            <Translation id="moduleTrading.tradingConfirmationScreen.exploreInBlockchain" />
        </Button>
    );
};
