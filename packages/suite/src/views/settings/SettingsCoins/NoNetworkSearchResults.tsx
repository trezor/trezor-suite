import { Translation } from '@suite/intl';
import { Text } from '@trezor/components';

export const NoNetworkSearchResults = () => (
    <Text
        typographyStyle="body-md"
        intent="neutral"
        priority="secondary"
        align="center"
        data-testid="@settings-coins/no-networks-found"
    >
        <Translation id="TR_NO_NETWORKS_FOUND" />
    </Text>
);
