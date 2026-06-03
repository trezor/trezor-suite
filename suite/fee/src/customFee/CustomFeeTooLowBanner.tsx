import { memo } from 'react';
import { useWatch } from 'react-hook-form';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { useFeesContext } from '@suite-common/fee';
import { type FormState } from '@suite-common/wallet-types';
import { getLowestFeeFromLevels } from '@suite-common/wallet-utils';
import { Banner, Collapsible } from '@trezor/components';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import { FEE_PER_UNIT } from './customFeeConstants';

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
                    intent="warning"
                    rightContent={
                        <LearnMoreButton url={HELP_CENTER_TRANSACTION_FEES_URL} intent="warning" />
                    }
                    description={<Translation id="TR_CUSTOM_FEE_WARNING" />}
                />
            </Collapsible.Content>
        </Collapsible>
    );
});
