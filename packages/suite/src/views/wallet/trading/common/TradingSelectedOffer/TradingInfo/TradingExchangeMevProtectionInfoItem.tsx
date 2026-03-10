import { FormattedList } from 'react-intl';

import { Translation } from '@suite/intl';
import { Icon, InfoItem, Tooltip } from '@trezor/components';

type TradingExchangeMevProtectionInfoItemProps = {
    isMevProtectionEnabled: boolean;
    supportedNetworks: string[];
};

export const TradingExchangeMevProtectionInfoItem = ({
    isMevProtectionEnabled,
    supportedNetworks,
}: TradingExchangeMevProtectionInfoItemProps) => {
    const hasSupportedNetworks = supportedNetworks.length > 0;

    return (
        <InfoItem
            label={
                <Tooltip
                    content={
                        hasSupportedNetworks ? (
                            <>
                                <Translation id="TR_MEV_DESCRIPTION" />{' '}
                                <Translation
                                    id="TR_MEV_AVAILABLE_ON"
                                    values={{
                                        supportedNetworks: (
                                            <FormattedList
                                                type="conjunction"
                                                value={supportedNetworks}
                                            />
                                        ),
                                    }}
                                />
                            </>
                        ) : (
                            <Translation id="TR_MEV_DESCRIPTION" />
                        )
                    }
                    hasIcon
                >
                    <Translation id="TR_MEV" />
                </Tooltip>
            }
            direction="row"
        >
            <Icon
                name={isMevProtectionEnabled ? 'check' : 'x'}
                size={16}
                intent={isMevProtectionEnabled ? 'brand' : 'neutral'}
                priority={isMevProtectionEnabled ? 'primary' : 'secondary'}
            />
        </InfoItem>
    );
};
