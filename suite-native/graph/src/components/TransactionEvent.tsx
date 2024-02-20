import { useEffect } from 'react';
import {
    runOnJS,
    useDerivedValue,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { Circle, Group } from '@shopify/react-native-skia';

import { EventComponentProps } from '@suite-native/react-native-graph/src/LineGraphProps';
import { Color, ThemeColorVariant } from '@trezor/theme';
import { useNativeStyles } from '@trezor/styles';
import { GroupedBalanceMovementEventPayload } from '@suite-common/graph';
import { useActiveColorScheme } from '@suite-native/theme';

import { GraphContextProvider } from './GraphContextProvider';

type EventVariant = 'positive' | 'negative';

type TransactionEventProps = EventComponentProps<GroupedBalanceMovementEventPayload>;

const INNER_DOT_WIDTH = 2.5;
const ACTIVE_INNER_DOT_WIDTH = 4.5;
const OUTER_DOT_WIDTH = 6;
const ACTIVE_OUTER_DOT_WIDTH = 8;
const ENTERING_ANIMATION_DURATION = 750;

// FIXME: Color variants are wrongly defined, so we have to specify different outer colors individually for each color theme.
// Color definitions should be redesigned to use the same color variant for all color themes.
const variantToStylesMaps = {
    standard: {
        positive: {
            innerColor: 'backgroundPrimaryDefault',
            outerColor: 'backgroundPrimarySubtleOnElevation0',
        },
        negative: {
            innerColor: 'backgroundAlertRedBold',
            outerColor: 'backgroundAlertRedSubtleOnElevation0',
        },
    },
    dark: {
        positive: {
            innerColor: 'backgroundPrimaryDefault',
            outerColor: 'backgroundPrimarySubtleOnElevation1',
        },
        negative: {
            innerColor: 'backgroundAlertRedBold',
            outerColor: 'backgroundAlertRedSubtleOnElevation1',
        },
    },
} as const satisfies Record<
    ThemeColorVariant,
    Record<EventVariant, { innerColor: Color; outerColor: Color }>
>;

const TransactionEventContent = ({
    isGraphActive,
    fingerX,
    eventX,
    eventY,
    index,
    received,
    sent,
    onEventHover,
}: TransactionEventProps) => {
    const {
        utils: { colors },
    } = useNativeStyles();

    const colorScheme = useActiveColorScheme();
    const isActive = useDerivedValue(() => {
        // If the finger is on X position of the event.
        if (isGraphActive.value && Math.abs(fingerX.value - eventX) < ACTIVE_OUTER_DOT_WIDTH) {
            // Set it to active and share it's metadata with `TransactionEventTooltip` component.
            if (onEventHover) runOnJS(onEventHover)(index, true);

            return true;
        }

        if (onEventHover) runOnJS(onEventHover)(index, false);

        return false;
    });

    const innerDotRadius = useDerivedValue(() =>
        withSpring(isActive.value ? ACTIVE_INNER_DOT_WIDTH : INNER_DOT_WIDTH),
    );
    const outerDotRadius = useDerivedValue(() =>
        withSpring(isActive.value ? ACTIVE_OUTER_DOT_WIDTH : OUTER_DOT_WIDTH),
    );

    const animatedOpacity = useSharedValue(0);

    useEffect(() => {
        // Entering opacity animation triggered on the first render.
        animatedOpacity.value = withTiming(1, { duration: ENTERING_ANIMATION_DURATION });
    }, [animatedOpacity]);

    const variant: EventVariant = received >= sent ? 'positive' : 'negative';

    const { innerColor, outerColor } = variantToStylesMaps[colorScheme][variant];

    return (
        <Group opacity={animatedOpacity}>
            <Circle
                cx={eventX}
                cy={eventY}
                r={ACTIVE_OUTER_DOT_WIDTH}
                color={colors.backgroundSurfaceElevation1}
            />
            <Circle cx={eventX} cy={eventY} r={outerDotRadius} color={colors[outerColor]} />
            <Circle cx={eventX} cy={eventY} r={innerDotRadius} color={colors[innerColor]} />
        </Group>
    );
};

export const TransactionEvent = (props: TransactionEventProps) => (
    <GraphContextProvider>
        <TransactionEventContent {...props} />
    </GraphContextProvider>
);
