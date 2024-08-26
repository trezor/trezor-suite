import { Translation } from '@suite-native/intl';
import { Text } from '@suite-native/atoms';

import { AddressReviewHelpSheet } from './AddressReviewHelpSheet';
import { AddressReviewSheetSection } from './AddressReviewSheetSection';

export const AddressOriginHelpButton = () => {
    return (
        <AddressReviewHelpSheet
            title={<Translation id="moduleSend.review.address.originBottomSheet.title" />}
            subtitle={
                <Text variant="body">
                    <Translation id="moduleSend.review.address.originBottomSheet.subtitle" />
                </Text>
            }
        >
            <AddressReviewSheetSection
                title={
                    <Translation id="moduleSend.review.address.originBottomSheet.exchange.header" />
                }
                content={
                    <Translation id="moduleSend.review.address.originBottomSheet.exchange.body" />
                }
            />

            <AddressReviewSheetSection
                title={
                    <Translation id="moduleSend.review.address.originBottomSheet.person.header" />
                }
                content={
                    <Translation id="moduleSend.review.address.originBottomSheet.person.body" />
                }
            />
        </AddressReviewHelpSheet>
    );
};
