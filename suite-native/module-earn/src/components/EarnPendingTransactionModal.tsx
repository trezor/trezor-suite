import { type ReactNode, type RefObject, useCallback, useEffect, useMemo } from 'react';
import {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

import { type BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import {
    BottomSheetGrabber,
    BottomSheetModal,
    Box,
    Button,
    Card,
    CircularSpinner,
    HStack,
    IconButton,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type EarnPendingTransactionRow = {
    label: ReactNode;
    value: ReactNode;
};

export type EarnPendingTransactionModalRef = RefObject<BottomSheetModalMethods | null>;

type EarnPendingTransactionModalProps = {
    ref: EarnPendingTransactionModalRef;
    title: ReactNode;
    resetKey?: string;
    rows: EarnPendingTransactionRow[];
    onExploreInBlockchain?: () => void;
};

type RowStyleProps = {
    isLast: boolean;
};

const headerStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp8,
}));

const handleStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp8,
    marginBottom: utils.spacings.sp16,
}));

const EXPANDED_SNAP_INDEX = 1;
const MINIMIZED_SNAP_POINT = 148;
const EXPANDED_SNAP_POINT = 592;
const SNAP_INDEX_MIDPOINT = 0.5;

const indicatorStyle = prepareNativeStyle(utils => ({
    width: 56,
    height: 56,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.surfaceFillRaised,
    alignItems: 'center',
    justifyContent: 'center',
    ...utils.boxShadows.small,
}));

const rowStyle = prepareNativeStyle<RowStyleProps>((utils, { isLast }) => ({
    minHeight: 52,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    borderBottomWidth: isLast ? 0 : utils.borders.widths.small,
    borderBottomColor: utils.colors.borderNeutral,
}));

const valueWrapperStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    alignItems: 'flex-end',
}));

const renderEmptyComponent = () => null;

const PendingTransactionModalHandle = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(handleStyle)}>
            <BottomSheetGrabber />
        </Box>
    );
};

const EarnPendingTransactionModalRow = ({
    label,
    value,
    isLast,
}: EarnPendingTransactionRow & RowStyleProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack
            alignItems="center"
            justifyContent="space-between"
            spacing="sp16"
            style={applyStyle(rowStyle, { isLast })}
        >
            <Text variant="body-sm" color="contentSecondary">
                {label}
            </Text>
            <Box style={applyStyle(valueWrapperStyle)}>{value}</Box>
        </HStack>
    );
};

export const EarnPendingTransactionModal = ({
    ref,
    title,
    resetKey,
    rows,
    onExploreInBlockchain,
}: EarnPendingTransactionModalProps) => {
    const { applyStyle } = useNativeStyles();
    const animatedIndex = useSharedValue(EXPANDED_SNAP_INDEX);
    const snapPoints = useMemo(() => [MINIMIZED_SNAP_POINT, EXPANDED_SNAP_POINT], []);
    const caretAnimatedStyle = useAnimatedStyle(() => {
        const rotation = interpolate(
            animatedIndex.value,
            [0, EXPANDED_SNAP_INDEX],
            [180, 0],
            Extrapolation.CLAMP,
        );

        return {
            transform: [{ rotateZ: `${rotation}deg` }],
        };
    });

    const handleToggleExpanded = useCallback(() => {
        const isExpanded = animatedIndex.value >= SNAP_INDEX_MIDPOINT;

        if (isExpanded) {
            ref.current?.collapse();
        } else {
            ref.current?.expand();
        }
    }, [animatedIndex, ref]);

    useEffect(() => {
        ref.current?.expand();
    }, [ref, resetKey]);

    return (
        <BottomSheetModal
            ref={ref}
            bottomSheetCustomProps={{
                backdropComponent: renderEmptyComponent,
                enablePanDownToClose: false,
                enableDynamicSizing: false,
                handleComponent: PendingTransactionModalHandle,
                index: EXPANDED_SNAP_INDEX,
                animatedIndex,
                snapPoints,
            }}
        >
            <VStack spacing="sp24">
                <HStack
                    alignItems="center"
                    justifyContent="space-between"
                    style={applyStyle(headerStyle)}
                >
                    <Text variant="headline-sm">{title}</Text>
                    <IconButton
                        accessibilityRole="button"
                        iconName="caretDown"
                        iconStyle={caretAnimatedStyle}
                        onPress={handleToggleExpanded}
                        intent="neutral"
                        priority="secondary"
                    />
                </HStack>

                <VStack spacing="sp16">
                    <Box alignItems="center">
                        <Box style={applyStyle(indicatorStyle)}>
                            <CircularSpinner
                                size={56}
                                color="legacyBackgroundAlertYellowBold"
                                width={2}
                            />
                            <Icon name="arrowUp" size="extraLarge" color="contentPrimary" />
                        </Box>
                    </Box>

                    <Card noPadding borderColor="borderNeutral">
                        {rows.map((row, index) => (
                            <EarnPendingTransactionModalRow
                                key={index}
                                {...row}
                                isLast={index === rows.length - 1}
                            />
                        ))}
                    </Card>

                    <Button
                        intent="neutral"
                        priority="secondary"
                        iconRight="arrowUpRight"
                        isDisabled={!onExploreInBlockchain}
                        onPress={onExploreInBlockchain}
                    >
                        <Translation id="transactions.detail.exploreButton" />
                    </Button>
                </VStack>
            </VStack>
        </BottomSheetModal>
    );
};
