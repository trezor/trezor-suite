import { spacings, spacingsPx } from '@trezor/theme';
import { css } from 'styled-components';
import { SIDEBAR_WIDTH_NUMERIC } from 'src/components/suite/Preloader/SuiteLayout/Sidebar/Sidebar';

export const MAX_CONTENT_WIDTH_NUMERIC = 1200;
export const MAX_CONTENT_WIDTH = `${MAX_CONTENT_WIDTH_NUMERIC}px`;
export const MAX_ONBOARDING_WIDTH = '1020px'; // old max width, kept for consistency
export const HORIZONTAL_LAYOUT_PADDINGS = spacingsPx.md;
export const SUBPAGE_NAV_HEIGHT = '60px';

// TODO: together with designers change the SuiteLayout so that the negative paddings are not needed
// either do not have max-width in the SuiteLayout but in the local Page Layouts
// or add one more structural element to the SuiteLayout, which is added via the useLayout hook:
// <TopMenu />
// <NewElement />
// <ContentWrapper>{children}</ContentWrapper>
const sidePaddingWidth = `(100vw - ${MAX_CONTENT_WIDTH} + ${
    spacings.md * 2
}px - ${SIDEBAR_WIDTH_NUMERIC}px) / 2`;

export const globalPaddingEraserStyle = css`
    padding-left: ${spacingsPx.md};
    padding-right: ${spacingsPx.md};

    /* when paddings begin to appear due to the layout not being hugged by the content
  here, the negative horizontal margins are equal to the paddings */
    margin: 0 calc(-1 * ${sidePaddingWidth}) ${spacingsPx.lg};

    /* when the content is hugged by the layout */
    @media (max-width: ${MAX_CONTENT_WIDTH_NUMERIC + SIDEBAR_WIDTH_NUMERIC}px) {
        margin: 0 -${spacingsPx.md} ${spacingsPx.lg};
    }
`;
