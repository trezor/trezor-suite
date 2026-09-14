import { memo } from 'react';
import { useWatch } from 'react-hook-form';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { type FormState } from '@suite-common/wallet-types';
import { isCustomFeeBelowLowestLevel } from '@suite-common/wallet-utils';
import { Banner, Collapsible } from '@trezor/components';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';

import { FEE_PER_UNIT } from './constants';
import { useFeesContext } from '../../context/FeesContext';

export const CustomFeeTooLowBanner = memo(function CustomFeeTooLowBannerInner() {
    const { feeInfo } = useFeesContext();
    const feePerUnitValue = useWatch<FormState, typeof FEE_PER_UNIT>({ name: FEE_PER_UNIT });
    const isCustomFeeBelowLowest = isCustomFeeBelowLowestLevel(feePerUnitValue, feeInfo.levels);

    return (
        <Collapsible isOpen={isCustomFeeBelowLowest}>
            <Collapsible.Content>
                <Banner
                    icon
                    intent="warning"
                    rightContent={
                        <LearnMoreButton url={HELP_CENTER_TRANSACTION_FEES_URL} intent="warning" />
                    }
                    description={<Translation id="TR_CUSTOM_FEE_TOO_LOW_WARNING" />}
                />
            </Collapsible.Content>
        </Collapsible>
    );
});
