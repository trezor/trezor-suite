import { useLayoutEffect, useRef, useState } from 'react';

import { Box, Button, Text, VStack } from '@suite-native/atoms';
import {
    //CryptoAmountFormatter,
    //CryptoAmountFormatterFast,
    CryptoAmountFormatterNonPrecise,
} from '@suite-native/formatters';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

const ITEM_COUNT = 1000;

const rowStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp4,
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.elementBorderNeutralSofter,
}));

const STEP = new BigNumber('0.01234567890123456789');

const ITEMS = Array.from({ length: ITEM_COUNT }, (_, index) => ({
    key: index,
    value: STEP.multipliedBy(index + 1).toString(),
}));

export const FormattersExperimentScreen = () => {
    const { applyStyle } = useNativeStyles();

    const [version, setVersion] = useState(0);
    const [renderDurationMs, setRenderDurationMs] = useState<number | null>(null);

    const renderStartRef = useRef(0);
    /* eslint-disable-next-line */
    renderStartRef.current = performance.now();

    useLayoutEffect(() => {
        const elapsed = performance.now() - renderStartRef.current;
        setRenderDurationMs(elapsed);
    }, [version]);

    return (
        <Screen header={<ScreenHeader title="Formatters experiment" />}>
            <VStack spacing="sp16">
                <Box>
                    <Text variant="headline-sm">Render #{version}</Text>
                    <Text variant="body-md">
                        {renderDurationMs === null
                            ? 'Measuring…'
                            : `Rendered ${ITEM_COUNT} values in ${renderDurationMs.toFixed(2)} ms`}
                    </Text>
                </Box>
                <Button onPress={() => setVersion(prev => prev + 1)}>Rerender</Button>
                <VStack spacing={0}>
                    {ITEMS.map(item => (
                        <Box key={item.key} style={applyStyle(rowStyle)}>
                            <CryptoAmountFormatterNonPrecise value={item.value} symbol="eth" />
                        </Box>
                    ))}
                </VStack>
            </VStack>
        </Screen>
    );
};
