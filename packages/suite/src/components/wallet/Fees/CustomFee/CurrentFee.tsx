import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { FeeInfo } from '@suite-common/wallet-types';
import { isEip1559 } from '@suite-common/wallet-utils';
import { Icon, Row, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

type CurrentFeeProps = {
    networkType: NetworkType;
    feeInfo: FeeInfo;
    networkSymbol: NetworkSymbol;
};

const getCurrentFeeRate = (feeInfo: FeeInfo) => {
    const { levels } = feeInfo;

    if (isEip1559(levels[0])) {
        return levels[0].baseFeePerGas;
    }

    const middleIndex = Math.floor((levels.length - 1) / 2);

    return levels[middleIndex].feePerUnit;
};

const getCurrentFeeRateLabel = (feeInfo: FeeInfo) => {
    const { levels } = feeInfo;

    if (levels[0].baseFeePerGas) {
        return 'TR_CURRENT_BASE_FEE';
    }

    return 'TR_CURRENT_FEE_CUSTOM_FEES';
};

export const CurrentFee = ({ networkType, feeInfo, networkSymbol }: CurrentFeeProps) => {
    const currentFeeRate = getCurrentFeeRate(feeInfo);
    const currentFeeRateLabel = getCurrentFeeRateLabel(feeInfo);

    return (
        <Row justifyContent="space-between">
            <Text variant="tertiary" typographyStyle="hint">
                <Translation id={currentFeeRateLabel} />
            </Text>
            <Text variant="default" typographyStyle="hint">
                <Row alignItems="center" gap={spacings.xxs}>
                    <Text>
                        <FeeRate
                            feeRate={currentFeeRate}
                            networkType={networkType}
                            symbol={networkSymbol}
                        />
                    </Text>
                    <Icon
                        name={networkType === 'ethereum' ? 'gasPump' : 'receipt'}
                        size="mediumLarge"
                    />
                </Row>
            </Text>
        </Row>
    );
};
