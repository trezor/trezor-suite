# @suite-common/icons

Icons for the native (mobile) app. General icon SVG sources live in `@trezor/icons` (`packages/icons/assets`).

## How to add or update an icon

1. Export the icon as SVG from Figma and rename it to camelCase (`Warning Circle.svg` → `warningCircle.svg`), place it in `@trezor/icons/assets`.
2. Run `yarn generate-icons` from repo root

## Network assets

Network and native coin SVGs belong to each network family's `network-<family>-assets`
package, in `assets/cryptoIcons` and `assets/networkIcons`. These lightweight packages expose
`getSupportedNetworks` and `getIcons` through their asset modules, with no Suite or blockchain
runtime dependencies. SVGs load when requested through `getIcons`.

Connect Explorer registers asset modules in its composition root using `@trezor/network-assets`.
Suite network modules delegate their nested `icon.getIcons` service to the same asset modules;
token logo identifier resolution stays in the Suite network services. Monero and Tezos have
asset packages without being registered as Suite wallet networks.

The native compatibility catalogs discover those directories automatically. After adding or
moving an asset, run `yarn node generateIcons.mjs --network-icons-only` from this package.
This refreshes the catalogs using package asset exports without rewriting SVGs. Other legacy
display-only icons remain in `cryptoAssets` until their consumers own them.

## In case some icons are not rendering correctly in icon font

1. Copy a whole path from the SVG file of the problematic icon.
2. Open `https://yqnn.github.io/svg-path-editor/` and paste the path there.
3. Select the problematic segment in the _Commands_ section and fix it by running _Reverse Subpath_.
4. Check the _Minify output_ checkbox and copy&paste the fixed path back into the SVG file.
5. Regenerate icons with `yarn generate-icons`.
