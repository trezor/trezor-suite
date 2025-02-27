import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { Icon, IconName, Row, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

type CurrentFeeProps = {
    networkType: NetworkType;
    feeIconName: IconName;
    currentFee: string;
    symbol: NetworkSymbol;
};

export const CurrentFee = ({ networkType, feeIconName, currentFee, symbol }: CurrentFeeProps) => (
    <Row justifyContent="space-between">
        <Text variant="tertiary" typographyStyle="hint">
            <Translation id="TR_CURRENT_FEE_CUSTOM_FEES" />
        </Text>
        <Text variant="default" typographyStyle="hint">
            <Row alignItems="center" gap={spacings.xxs}>
                <Text>
                    <FeeRate feeRate={currentFee} networkType={networkType} symbol={symbol} />
                </Text>
                <Icon name={feeIconName} size="mediumLarge" />
            </Row>
        </Text>
    </Row>
);
