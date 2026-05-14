import { Translation } from '@suite/intl';
import { type FeeInfo } from '@suite-common/wallet-types';
import { isEip1559 } from '@suite-common/wallet-utils';
import { Icon, Row, Text } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useFeesContext } from '../../context/FeesContext';

const getCurrentFeeRate = (feeInfo: FeeInfo) => {
    const { levels } = feeInfo;

    if (isEip1559(levels.at(0))) {
        return levels.at(0)?.baseFeePerGas;
    }

    const middleIndex = Math.floor((levels.length - 1) / 2);

    return levels.at(middleIndex)?.feePerUnit;
};

const getCurrentFeeRateLabel = (feeInfo: FeeInfo) => {
    const { levels } = feeInfo;

    if (levels.at(0)?.baseFeePerGas) {
        return 'TR_CURRENT_BASE_FEE';
    }

    return 'TR_CURRENT_FEE_CUSTOM_FEES';
};

export const CurrentFee = () => {
    const { feeInfo, networkType } = useFeesContext();
    const currentFeeRate = getCurrentFeeRate(feeInfo);
    const currentFeeRateLabel = getCurrentFeeRateLabel(feeInfo);

    return (
        <Row justifyContent="space-between">
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <Translation id={currentFeeRateLabel} />
            </Text>
            <Text intent="neutral" typographyStyle="body-sm">
                <Row alignItems="center" gap={spacings.xxs}>
                    <Text>
                        <FeeRate feeRate={currentFeeRate} networkType={networkType} />
                    </Text>
                    <Icon name={networkType === 'ethereum' ? 'gasPump' : 'receipt'} size={20} />
                </Row>
            </Text>
        </Row>
    );
};
