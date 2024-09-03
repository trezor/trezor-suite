import React from 'react';
import Zoom from 'react-medium-image-zoom';
import { useRouter } from 'next/router';

import { createGlobalStyle, useTheme, styled } from 'styled-components';

import 'react-medium-image-zoom/dist/styles.css';

export type ZoomableIllustrationProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    $darkMode?: boolean;
};

// Automatically invert colors of the image when darkMode is enabled
const DarkModeImg = styled.img<{ $darkMode?: boolean }>`
    filter: ${({ $darkMode }) => ($darkMode ? 'invert(1) hue-rotate(180deg)' : 'invert(0)')};
`;

// Handle dark mode styles in react-medium-image-zoom
const ReactMediumImageZoomStyle = createGlobalStyle<{ $darkMode?: boolean }>`
  html.dark [data-rmiz-modal-overlay="visible"] {
    background-color: rgba(0, 0, 0, 1);
  }

  [data-rmiz-modal-img] {
    filter: ${({ $darkMode }) => ($darkMode ? 'invert(1) hue-rotate(180deg)' : 'invert(0)')};
  }
`;

export const ZoomableIllustration = (props: ZoomableIllustrationProps) => {
    const router = useRouter();
    const theme = useTheme();
    const { THEME } = theme.legacy;
    const darkMode = props.$darkMode && THEME === 'dark';

    // Automatic absolute path handling
    const src = props?.src?.startsWith('/') ? router.basePath + props.src : props.src;

    return (
        <Zoom>
            <ReactMediumImageZoomStyle $darkMode={darkMode} />
            <DarkModeImg {...props} src={src} $darkMode={darkMode} />
        </Zoom>
    );
};

export default ZoomableIllustration;
