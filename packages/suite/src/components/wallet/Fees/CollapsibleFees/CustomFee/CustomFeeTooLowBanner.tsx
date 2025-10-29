import { memo } from 'react';
import { useWatch } from 'react-hook-form';

import { FormState } from '@suite-common/wallet-types';
import { getLowestFeeFromLevels } from '@suite-common/wallet-utils';
import { Banner, Collapsible } from '@trezor/components';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { Translation } from 'src/components/suite/Translation';

import { FEE_PER_UNIT } from './constants';
import { useFeesContext } from '../../context/FeesContext';

export const CustomFeeTooLowBanner = memo(function CustomFeeTooLowBannerInner() {
    const { feeInfo } = useFeesContext();
    const feePerUnitValue = useWatch<FormState, typeof FEE_PER_UNIT>({ name: FEE_PER_UNIT });
    const lowestFeeLevel = getLowestFeeFromLevels(feeInfo.levels);
    const isCustomFeeBelowLowest = BigNumber(feePerUnitValue).isLessThan(lowestFeeLevel);

    return (
        <Collapsible isOpen={isCustomFeeBelowLowest}>
            <Collapsible.Content>
                <Banner
                    icon
                    variant="warning"
                    rightContent={
                        <LearnMoreButton
                            textWrap={false}
                            url={HELP_CENTER_TRANSACTION_FEES_URL}
                            variant="warning"
                        />
                    }
                >
                    <Translation id="TR_CUSTOM_FEE_WARNING" />
                </Banner>
            </Collapsible.Content>
        </Collapsible>
    );
});
