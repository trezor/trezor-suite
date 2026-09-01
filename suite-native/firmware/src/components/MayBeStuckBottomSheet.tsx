import { useState } from 'react';
import { FadeIn } from 'react-native-reanimated';

import { type FirmwareUpdateStuckedState } from '@suite-native/analytics';
import {
    AnimatedVStack,
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    NumberedListItem,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type MayBeStuckBottomSheetProps = {
    onClose: () => void;
    onAnalyticsReportStuck: (state: FirmwareUpdateStuckedState) => void;
    ref: BottomSheetModalRef;
};

export const MayBeStuckBottomSheet = ({
    onClose,
    onAnalyticsReportStuck,
    ref,
}: MayBeStuckBottomSheetProps) => {
    const [visiblePart, setVisiblePart] = useState<1 | 2>(1);

    const handleClose = () => {
        onClose();
        setVisiblePart(1);
    };

    const handleContinue = () => {
        setVisiblePart(2);
        onAnalyticsReportStuck('modalPart2');
    };

    return (
        <BottomSheetModal ref={ref}>
            {visiblePart === 1 && (
                <AnimatedVStack spacing="sp24">
                    <TitleHeader
                        title={<Translation id="firmware.stuckedBottomSheet.part1.title" />}
                        subtitle={
                            <Translation id="firmware.stuckedBottomSheet.part1.description" />
                        }
                    />
                    <VStack spacing="sp12">
                        <Button onPress={handleContinue} intent="warning" priority="primary">
                            <Translation id="firmware.stuckedBottomSheet.part1.continueButton" />
                        </Button>
                        <Button onPress={handleClose} intent="warning" priority="secondary">
                            <Translation id="firmware.stuckedBottomSheet.part1.closeButton" />
                        </Button>
                    </VStack>
                </AnimatedVStack>
            )}
            {visiblePart === 2 && (
                <AnimatedVStack entering={FadeIn} spacing="sp24">
                    <TitleHeader
                        title={<Translation id="firmware.stuckedBottomSheet.part2.title" />}
                        subtitle={<Translation id="firmware.stuckedBottomSheet.part2.subtitle" />}
                    />
                    <VStack spacing="sp2">
                        <NumberedListItem number={1}>
                            <Translation id="firmware.stuckedBottomSheet.part2.tip1" />
                        </NumberedListItem>
                        <NumberedListItem number={2}>
                            <Translation id="firmware.stuckedBottomSheet.part2.tip2" />
                        </NumberedListItem>
                        <NumberedListItem number={3}>
                            <Translation id="firmware.stuckedBottomSheet.part2.tip3" />
                        </NumberedListItem>
                    </VStack>
                    <Button onPress={handleClose} intent="brand" priority="primary">
                        <Translation id="firmware.stuckedBottomSheet.part2.gotItButton" />
                    </Button>
                </AnimatedVStack>
            )}
        </BottomSheetModal>
    );
};
