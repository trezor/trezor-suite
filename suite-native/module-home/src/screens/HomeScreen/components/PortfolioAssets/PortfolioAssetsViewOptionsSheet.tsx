import { BottomSheetModal, type BottomSheetModalRef, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type PortfolioAssetsViewOptionsSheetProps = {
    bottomSheetRef: BottomSheetModalRef;
};

// TODO: the view options themselves come in a follow-up (#32746).
export const PortfolioAssetsViewOptionsSheet = ({
    bottomSheetRef,
}: PortfolioAssetsViewOptionsSheetProps) => (
    <BottomSheetModal
        ref={bottomSheetRef}
        title={<Translation id="moduleHome.assets.viewOptionsSheet.title" />}
        isCloseDisplayed
    >
        <Text variant="body-sm" color="contentSecondary">
            TBD: view options will be added in a follow-up.
        </Text>
    </BottomSheetModal>
);
