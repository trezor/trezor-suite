import { Translation } from '@suite/intl';
import { InfoItem, Text } from '@trezor/components';

import { TradingGetProvidersInfoProps } from 'src/types/trading/trading';
import { TradingProviderInfo } from 'src/views/wallet/trading/common/TradingProviderInfo';

type TradingProviderInfoItemProps = {
    exchange: string | undefined;
    providers: TradingGetProvidersInfoProps;
};

export const TradingProviderInfoItem = ({ exchange, providers }: TradingProviderInfoItemProps) => (
    <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
        <Text typographyStyle="body-sm" as="div">
            <TradingProviderInfo exchange={exchange} providers={providers} />
        </Text>
    </InfoItem>
);
