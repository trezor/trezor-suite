import { Translation } from '@suite/intl';
import { Text } from '@trezor/components';

import { type UnsupportedCustomNetworkReason } from '#src/utils/settings/customNetworks/customNetworkCatalogue';

type CustomNetworkUnsupportedReasonProps = {
    reason: UnsupportedCustomNetworkReason;
};

export const CustomNetworkUnsupportedReason = ({ reason }: CustomNetworkUnsupportedReasonProps) => (
    <Text
        typographyStyle="body-sm"
        intent="neutral"
        priority="secondary"
        ellipsisLineCount={1}
        data-testid="@add-custom-network/unsupported-reason"
    >
        {reason.type === 'nativeCurrencyDecimals' && (
            <Translation
                id="TR_CUSTOM_NETWORK_UNSUPPORTED_DECIMALS"
                values={{ decimals: reason.decimals }}
            />
        )}
        {reason.type === 'noRpcUrl' && <Translation id="TR_CUSTOM_NETWORK_NO_RPC_URL" />}
        {reason.type === 'noExplorerUrl' && <Translation id="TR_CUSTOM_NETWORK_NO_EXPLORER_URL" />}
    </Text>
);
