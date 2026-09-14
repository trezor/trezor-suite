import { memo } from 'react';
import { useWatch } from 'react-hook-form';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { type FormState } from '@suite-common/wallet-types';
import { getCustomFeeWarning, getFeeUnits } from '@suite-common/wallet-utils';
import { Banner, Collapsible } from '@trezor/components';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';

import { FEE_PER_UNIT, MAX_FEE_PER_GAS } from './constants';
import { useFeesContext } from '../../context/FeesContext';

export const CustomFeeTooLowBanner = memo(function CustomFeeTooLowBannerInner() {
    const { feeInfo, networkType } = useFeesContext();
    const feePerUnitValue = useWatch<FormState, typeof FEE_PER_UNIT>({ name: FEE_PER_UNIT });
    const maxFeePerGasValue = useWatch<FormState, typeof MAX_FEE_PER_GAS>({
        name: MAX_FEE_PER_GAS,
    });
    const warning = getCustomFeeWarning(
        { feePerUnit: feePerUnitValue, maxFeePerGas: maxFeePerGasValue },
        feeInfo.levels,
    );

    return (
        <Collapsible isOpen={warning !== undefined}>
            <Collapsible.Content>
                <Banner
                    icon
                    intent="warning"
                    rightContent={
                        <LearnMoreButton url={HELP_CENTER_TRANSACTION_FEES_URL} intent="warning" />
                    }
                    description={
                        warning === 'belowBaseFee' ? (
                            <Translation
                                id="TR_CUSTOM_FEE_BELOW_BASE_FEE_WARNING"
                                values={{
                                    baseFee: `${feeInfo.levels.at(0)?.baseFeePerGas} ${getFeeUnits(networkType)}`,
                                }}
                            />
                        ) : (
                            <Translation id="TR_CUSTOM_FEE_TOO_LOW_WARNING" />
                        )
                    }
                />
            </Collapsible.Content>
        </Collapsible>
    );
});
