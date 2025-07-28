import { FeeInfo } from '@suite-common/wallet-types';
import { getLowestFeeFromLevels } from '@suite-common/wallet-utils';
import { Banner, Collapsible } from '@trezor/components';
import { HELP_CENTER_TRANSACTION_FEES_URL } from '@trezor/urls';
import { BigNumber } from '@trezor/utils';

import { Translation } from 'src/components/suite';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';

type CustomFeeTooLowBannerProps = {
    feePerUnitValue: string;
    feeInfo: FeeInfo;
};

export const CustomFeeTooLowBanner = ({ feePerUnitValue, feeInfo }: CustomFeeTooLowBannerProps) => {
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
};
