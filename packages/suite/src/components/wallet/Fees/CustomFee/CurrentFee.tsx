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
    isEip1559?: boolean;
};

// For priority fees it should show current base fee
export const CurrentFee = ({
    networkType,
    feeIconName,
    currentFee,
    symbol,
    isEip1559 = false,
}: CurrentFeeProps) => (
    <Row justifyContent="space-between">
        <Text variant="tertiary" typographyStyle="hint">
            <Translation id={isEip1559 ? 'TR_CURRENT_BASE_FEE' : 'TR_CURRENT_FEE_CUSTOM_FEES'} />
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
