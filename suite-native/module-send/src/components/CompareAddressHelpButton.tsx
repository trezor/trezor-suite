import { Translation } from '@suite-native/intl';

import { AddressReviewHelpSheet } from './AddressReviewHelpSheet';
import { AddressReviewSheetSection } from './AddressReviewSheetSection';

export const CompareAddressHelpButton = () => {
    return (
        <AddressReviewHelpSheet>
            <AddressReviewSheetSection
                title={<Translation id="moduleSend.review.address.compareBottomSheet.why.header" />}
                content={<Translation id="moduleSend.review.address.compareBottomSheet.why.body" />}
            />

            <AddressReviewSheetSection
                title={<Translation id="moduleSend.review.address.compareBottomSheet.how.header" />}
                content={<Translation id="moduleSend.review.address.compareBottomSheet.how.body" />}
            />
        </AddressReviewHelpSheet>
    );
};
