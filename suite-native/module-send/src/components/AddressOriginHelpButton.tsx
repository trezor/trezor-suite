import { Translation } from '@suite-native/intl';
import { Text } from '@suite-native/atoms';

import { AddressReviewHelpSheet } from './AddressReviewHelpSheet';
import { AddressReviewSheetSection } from './AddressReviewSheetSection';

export const AddressOriginHelpButton = () => {
    return (
        <AddressReviewHelpSheet
            title={
                <Text variant="titleSmall">
                    <Translation id="moduleSend.review.address.originBottomSheet.title" />
                </Text>
            }
            subtitle={
                <Text>
                    <Translation id="moduleSend.review.address.originBottomSheet.subtitle" />
                </Text>
            }
            body={
                <>
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
                </>
            }
        ></AddressReviewHelpSheet>
    );
};
