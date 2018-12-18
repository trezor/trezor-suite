import { css } from 'styled-components';
import RobotoLightCyrillicExt from '../fonts/roboto/regular/RobotoLightCyrillicExt.woff2';
import RobotoLightCyrillic from '../fonts/roboto/regular/RobotoLightCyrillic.woff2';
import RobotoLightGreekExt from '../fonts/roboto/regular/RobotoLightGreekExt.woff2';
import RobotoLightGreek from '../fonts/roboto/regular/RobotoLightGreek.woff2';
import RobotoLightVietnamese from '../fonts/roboto/regular/RobotoLightVietnamese.woff2';
import RobotoLightLatinExt from '../fonts/roboto/regular/RobotoLightLatinExt.woff2';
import RobotoLightLatin from '../fonts/roboto/regular/RobotoLightLatin.woff2';
import RobotoCyrillicExt from '../fonts/roboto/regular/RobotoCyrillicExt.woff2';
import RobotoCyrillic from '../fonts/roboto/regular/RobotoCyrillic.woff2';
import RobotoGreekExt from '../fonts/roboto/regular/RobotoGreekExt.woff2';
import RobotoGreek from '../fonts/roboto/regular/RobotoGreek.woff2';
import RobotoVietnamese from '../fonts/roboto/regular/RobotoVietnamese.woff2';
import RobotoLatinExt from '../fonts/roboto/regular/RobotoLatinExt.woff2';
import RobotoLatin from '../fonts/roboto/regular/RobotoLatin.woff2';
import RobotoMediumCyrillicExt from '../fonts/roboto/regular/RobotoMediumCyrillicExt.woff2';
import RobotoMediumCyrillic from '../fonts/roboto/regular/RobotoMediumCyrillic.woff2';
import RobotoMediumGreekExt from '../fonts/roboto/regular/RobotoMediumGreekExt.woff2';
import RobotoMediumGreek from '../fonts/roboto/regular/RobotoMediumGreek.woff2';
import RobotoMediumVietnamese from '../fonts/roboto/regular/RobotoMediumVietnamese.woff2';
import RobotoMediumLatinExt from '../fonts/roboto/regular/RobotoMediumLatinExt.woff2';
import RobotoMediumLatin from '../fonts/roboto/regular/RobotoMediumLatin.woff2';
import RobotoBoldCyrillicExt from '../fonts/roboto/regular/RobotoBoldCyrillicExt.woff2';
import RobotoBoldCyrillic from '../fonts/roboto/regular/RobotoBoldCyrillic.woff2';
import RobotoBoldGreekExt from '../fonts/roboto/regular/RobotoBoldGreekExt.woff2';
import RobotoBoldGreek from '../fonts/roboto/regular/RobotoBoldGreek.woff2';
import RobotoBoldVietnamese from '../fonts/roboto/regular/RobotoBoldVietnamese.woff2';
import RobotoBoldLatinExt from '../fonts/roboto/regular/RobotoBoldLatinExt.woff2';
import RobotoBoldLatin from '../fonts/roboto/regular/RobotoBoldLatin.woff2';

import RobotoMono from '../fonts/roboto/RobotoMonoRegular.woff2';

const fontStyles = css`

    @font-face {
        font-family: 'Roboto Mono';
        font-style: normal;
        font-display: swap;
        src: url(${RobotoMono}) format('woff2'), /* Super Modern Browsers */
    }

    /* cyrillic-ext */
    
    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url(${RobotoLightCyrillicExt}) format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
    /* cyrillic */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url(${RobotoLightCyrillic}) format('woff2');
        unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    /* greek-ext */
    
    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url(${RobotoLightGreekExt}) format('woff2');
        unicode-range: U+1F00-1FFF;
    }
    /* greek */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url(${RobotoLightGreek}) format('woff2');
        unicode-range: U+0370-03FF;
    }
    /* vietnamese */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url(${RobotoLightVietnamese}) format('woff2');
        unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
    }
    /* latin-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url(${RobotoLightLatinExt}) format('woff2');
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    /* latin */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 300;
        src: local('Roboto Light'), local('Roboto-Light'), url(${RobotoLightLatin}) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    /* cyrillic-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), url(${RobotoCyrillicExt}) format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
    /* cyrillic */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), url(${RobotoCyrillic}) format('woff2');
        unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    /* greek-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), url(${RobotoGreekExt}) format('woff2');
        unicode-range: U+1F00-1FFF;
    }
    /* greek */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), url(${RobotoGreek}) format('woff2');
        unicode-range: U+0370-03FF;
    }
    /* vietnamese */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), url(${RobotoVietnamese}) format('woff2');
        unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
    }
    /* latin-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), url(${RobotoLatinExt}) format('woff2');
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    /* latin */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 400;
        src: local('Roboto'), local('Roboto-Regular'), url(${RobotoLatin}) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    /* cyrillic-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), url(${RobotoMediumCyrillicExt}) format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
    /* cyrillic */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), url(${RobotoMediumCyrillic}) format('woff2');
        unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    /* greek-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), url(${RobotoMediumGreekExt}) format('woff2');
        unicode-range: U+1F00-1FFF;
    }
    /* greek */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), url(${RobotoMediumGreek}) format('woff2');
        unicode-range: U+0370-03FF;
    }
    /* vietnamese */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), url(${RobotoMediumVietnamese}) format('woff2');
        unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
    }
    /* latin-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), url(${RobotoMediumLatinExt}) format('woff2');
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    /* latin */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 500;
        src: local('Roboto Medium'), local('Roboto-Medium'), url(${RobotoMediumLatin}) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    /* cyrillic-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), url(${RobotoBoldCyrillicExt}) format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
    /* cyrillic */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), url(${RobotoBoldCyrillic}) format('woff2');
        unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    /* greek-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), url(${RobotoBoldGreekExt}) format('woff2');
        unicode-range: U+1F00-1FFF;
    }
    /* greek */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), url(${RobotoBoldGreek}) format('woff2');
        unicode-range: U+0370-03FF;
    }
    /* vietnamese */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), url(${RobotoBoldVietnamese}) format('woff2');
        unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
    }
    /* latin-ext */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), url(${RobotoBoldLatinExt}) format('woff2');
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
    /* latin */

    @font-face {
        font-family: 'Roboto';
        font-style: normal;
        font-display: swap;
        font-weight: 700;
        src: local('Roboto Bold'), local('Roboto-Bold'), url(${RobotoBoldLatin}) format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
`;

export default fontStyles;