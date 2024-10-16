import { generateFonts, FontAssetType, OtherAssetType } from 'fantasticon';

(async () => {
    const results = await generateFonts({
        inputDir: './assets',
        outputDir: './iconFonts',
        name: 'icons',
        fontTypes: [FontAssetType.EOT, FontAssetType.WOFF2, FontAssetType.WOFF, FontAssetType.TTF],
        assetTypes: [OtherAssetType.JSON, OtherAssetType.TS],
        formatOptions: { json: { indent: 4 } },
        templates: {},
        pathOptions: {},
        codepoints: {},
        fontHeight: 300,
        round: undefined, // --
        descent: undefined, // Will use `svgicons2svgfont` defaults
        normalize: false, // --
        tag: 'i',
        prefix: 'icon',
        fontsUrl: undefined,
    });
})();
