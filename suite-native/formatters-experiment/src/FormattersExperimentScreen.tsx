import { useLayoutEffect, useRef, useState } from 'react';

import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const ITEM_COUNT = 100;

const rowStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp4,
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.elementBorderNeutralSofter,
}));

const buildItems = (version: number) =>
    Array.from({ length: ITEM_COUNT }, (_, index) => {
        const base = (index + 1) * 0.000123;
        const offset = version * 0.0001;

        return {
            key: index,
            value: (base + offset).toFixed(8),
        };
    });

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

    const items = buildItems(version);

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
                    {items.map(item => (
                        <Box key={item.key} style={applyStyle(rowStyle)}>
                            <CryptoAmountFormatter value={item.value} symbol="btc" />
                        </Box>
                    ))}
                </VStack>
            </VStack>
        </Screen>
    );
};
