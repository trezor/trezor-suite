import { spacings, spacingsPx } from '@trezor/theme';
import { css } from 'styled-components';
import { useCustomBackends } from 'src/hooks/settings/backends';
import { useSelector } from 'src/hooks/suite';
import {
    MAX_CONTENT_WIDTH,
    MAX_CONTENT_WIDTH_NUMERIC,
    SIDEBAR_WIDTH_NUMERIC,
} from 'src/constants/suite/layout';

export const useEnabledBackends = () => {
    const enabledNetworks = useSelector(state => state.wallet.settings.enabledNetworks);
    const customBackends = useCustomBackends();
    return customBackends.filter(backend => enabledNetworks.includes(backend.coin));
};

// TODO: together with designers change the SuiteLayout so that the negative paddings are not needed
// either do not have max-width in the SuiteLayout but in the local Page Layouts
// or add one more structural element to the SuiteLayout, which is added via the useLayout hook:
// <TopMenu />
// <NewElement />
// <ContentWrapper>{children}</ContentWrapper>
const getSidePaddingWidth = (isFullWidth = false) =>
    `(100vw - ${MAX_CONTENT_WIDTH} + ${spacings.md * 2}px - ${
        isFullWidth ? 0 : SIDEBAR_WIDTH_NUMERIC
    }px) / 2`;

export const globalPaddingEraserStyle = css<{ isFullWidth?: boolean }>`
    padding-left: ${spacingsPx.md};
    padding-right: ${spacingsPx.md};

    /* when paddings begin to appear due to the layout not being hugged by the content
  here, the negative horizontal margins are equal to the paddings */
    margin: ${({ isFullWidth }) =>
        `0 calc(-1 * ${getSidePaddingWidth(isFullWidth)}) ${spacingsPx.lg}`};

    /* when the content is hugged by the layout */
    @media (max-width: ${MAX_CONTENT_WIDTH_NUMERIC + SIDEBAR_WIDTH_NUMERIC}px) {
        margin: 0 -${spacingsPx.md} ${spacingsPx.lg};
    }
`;
