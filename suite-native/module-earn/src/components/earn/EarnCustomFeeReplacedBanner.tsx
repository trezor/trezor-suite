import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const EarnCustomFeeReplacedBanner = () => (
    <BannerInline intent="info" title={<Translation id="earn.customFeeReplaced" />} />
);
