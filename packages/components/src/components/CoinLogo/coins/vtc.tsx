import React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';

const SvgComponent = (props: SvgProps) => (
    <Svg viewBox="0 0 256 256" {...props}>
        <Path d="M237.380793,61.5042819 L134.377445,207.319401 C134.377445,207.319401 132.385833,210.363207 128.347348,210.363207 C124.30548,210.363207 121.669921,207.143471 121.669921,207.143471 L103.899912,183.576811 L210.922573,30.5079824 C188.584035,11.4861674 159.632352,0 127.993233,0 C57.3045286,0 0,57.3045286 0,127.993233 C0,198.681938 57.3045286,255.986467 127.993233,255.986467 C198.681938,255.986467 255.986467,198.681938 255.986467,127.993233 C255.986467,103.643912 249.186115,80.882467 237.380793,61.5042819 Z M32.6574802,124.748687 L43.8132159,112.265586 L53.2265727,124.748687 L32.6574802,124.748687 Z M47.1558767,108.525956 L47.4152599,108.233868 L97.8359824,108.233868 L125.42985,144.184388 L100.78393,179.449233 L47.1558767,108.525956 Z" />
    </Svg>
);

export default SvgComponent;
