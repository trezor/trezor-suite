/** @jest-environment node */

import { renderToStaticMarkup } from 'react-dom/server';
import { ServerStyleSheet, ThemeProvider } from 'styled-components';

import { type Colors, colorVariants } from '@trezor/theme';

import { intermediaryTheme } from './colors';
import { Badge } from '../components/Badge/Badge';
import { Banner } from '../components/Banner/Banner';
import { Button } from '../components/buttons/Button/Button';
import { Checkbox } from '../components/form/Checkbox/Checkbox';

jest.mock('lottie-react', () => ({ __esModule: true, default: () => null }));

const luminance = (hex: string) => {
    const channels = hex
        .slice(1, 7)
        .match(/../g)!
        .map(channel => {
            const value = parseInt(channel, 16) / 255;

            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });

    return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
};

const composite = (foreground: string, background: string) => {
    const alpha = foreground.length === 9 ? parseInt(foreground.slice(7), 16) / 255 : 1;
    const channels = [1, 3, 5].map(offset =>
        Math.round(
            parseInt(foreground.slice(offset, offset + 2), 16) * alpha +
                parseInt(background.slice(offset, offset + 2), 16) * (1 - alpha),
        )
            .toString(16)
            .padStart(2, '0'),
    );

    return `#${channels.join('')}`;
};

const contrast = (foreground: string, background: string) => {
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);

    return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    );
};

const checkContrast = (colors: Colors, isInverse: boolean) => {
    const content = isInverse ? colors.contentOnDarkDebug : colors.contentDebug;
    const buttonContent = isInverse
        ? colors.contentOnDarkButtonDebugPrimary
        : colors.contentButtonDebugPrimary;
    const boldFills = isInverse
        ? [
              colors.elementFillOnDarkDebugBold,
              colors.elementFillOnDarkDebugBoldHovered,
              colors.elementFillOnDarkDebugBoldPressed,
          ]
        : [
              colors.elementFillDebugBold,
              colors.elementFillDebugBoldHovered,
              colors.elementFillDebugBoldPressed,
          ];
    const softFills = isInverse
        ? [
              colors.elementFillOnDarkDebugSoft,
              colors.elementFillOnDarkDebugSoftHovered,
              colors.elementFillOnDarkDebugSoftPressed,
          ]
        : [
              colors.elementFillDebugSoft,
              colors.elementFillDebugSoftHovered,
              colors.elementFillDebugSoftPressed,
          ];
    const surfaces = isInverse ? ['#1B1D1E'] : [colors.surfaceFillPage, colors.surfaceFillRaised];

    boldFills.forEach(fill => expect(contrast(buttonContent, fill)).toBeGreaterThanOrEqual(4.5));
    surfaces.forEach(surface => {
        expect(contrast(content, surface)).toBeGreaterThanOrEqual(4.5);
        softFills.forEach(fill =>
            expect(contrast(content, composite(fill, surface))).toBeGreaterThanOrEqual(4.5),
        );
    });
};

describe.each(['light', 'dark'] as const)('debug intent in %s theme', mode => {
    const theme = { ...intermediaryTheme[mode], variant: mode };

    it('keeps debug text readable on primary, secondary and inverse surfaces', () => {
        const colors = colorVariants[mode === 'light' ? 'standard' : 'dark'];
        checkContrast(colors, false);
        checkContrast(colors, true);
    });

    it('renders pink actions and badges and retains disabled behavior', () => {
        const sheet = new ServerStyleSheet();
        const markup = renderToStaticMarkup(
            sheet.collectStyles(
                <ThemeProvider theme={theme}>
                    <Button intent="debug" onClick={jest.fn()}>
                        Add activity
                    </Button>
                    <Button intent="debug" isDisabled onClick={jest.fn()}>
                        Disabled
                    </Button>
                    <Badge intent="debug" data-testid="badge">
                        Debug only
                    </Badge>
                    <Banner
                        intent="debug"
                        description="Diagnostics"
                        rightContent={<Banner.Button priority="secondary">Run</Banner.Button>}
                    />
                    <Checkbox intent="debug" isChecked onChange={jest.fn()}>
                        Add as unseen
                    </Checkbox>
                </ThemeProvider>,
            ),
        );

        const css = sheet.getStyleTags();
        sheet.seal();

        expect(css).toContain(`background:${theme.elementFillDebugBold}`);
        expect(css).toContain(`background:${theme.elementFillDebugSoft}`);
        expect(css).toContain(`background:${theme.elementFillBoldDisabled}`);
        expect(css).toContain(`--badge-color:${theme.elementFillDebugSoft}`);
        expect(css).toContain(`background-color:${theme.elementFillDebugBoldHovered}`);
        expect(css).not.toContain('undefined');
        expect(markup).toMatch(/<button[^>]*disabled=""/);
        expect(markup).toContain('type="checkbox"');
        expect(markup).toContain('checked=""');
    });
});
