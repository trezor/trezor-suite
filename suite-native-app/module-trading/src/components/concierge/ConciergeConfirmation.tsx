import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import { useConciergeProviders } from '../../hooks/concierge/useConciergeProviders';

export const ConciergeConfirmation = () => {
    const openLink = useOpenLink();
    const { selectedProvider } = useConciergeProviders();

    const handlePress = () => {
        openLink(selectedProvider.url);
    };

    if (!selectedProvider) {
        return null;
    }

    return (
        <Button onPress={handlePress} iconRight="arrowSquareOut">
            <Translation id="generic.buttons.continue" />
        </Button>
    );
};
