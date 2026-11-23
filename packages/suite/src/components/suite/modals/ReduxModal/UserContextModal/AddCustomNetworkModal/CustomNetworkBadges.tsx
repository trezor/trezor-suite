import { Translation } from '@suite/intl';
import { Badge, Row } from '@trezor/components';

import {
    type CustomNetworkCatalogueEntry,
    isCatalogueEntryVetted,
} from '#src/utils/settings/customNetworks/customNetworkCatalogue';

type CustomNetworkBadgesProps = {
    entry: CustomNetworkCatalogueEntry;
};

export const CustomNetworkBadges = ({ entry }: CustomNetworkBadgesProps) => (
    <Row gap={4} flex="0 0 auto">
        {!isCatalogueEntryVetted(entry) && (
            <Badge size="small" intent="warning" data-testid="@add-custom-network/unverified">
                <Translation id="TR_CUSTOM_NETWORK_UNVERIFIED" />
            </Badge>
        )}
        {entry.simulationSupport && (
            <Badge size="small" intent="neutral">
                <Translation id="TR_CUSTOM_NETWORK_SIMULATION_SUPPORTED" />
            </Badge>
        )}
        {entry.mayClearSign && (
            <Badge size="small" intent="neutral">
                <Translation id="TR_CUSTOM_NETWORK_MAY_CLEAR_SIGN" />
            </Badge>
        )}
    </Row>
);
