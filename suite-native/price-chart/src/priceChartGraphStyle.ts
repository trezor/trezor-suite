import { prepareNativeStyle } from '@trezor/styles-native';

const LINE_AREA_HEIGHT = 184;
// The line graph sets aside a 20 px padding and a 17 px row above and below the line for the
// high and low labels. The chart grows by that space so the line keeps its height.
const AXIS_LABEL_ROWS_HEIGHT = 2 * (20 + 17);

export const priceChartGraphStyle = prepareNativeStyle(() => ({
    height: LINE_AREA_HEIGHT + AXIS_LABEL_ROWS_HEIGHT,
    width: '100%',
}));
