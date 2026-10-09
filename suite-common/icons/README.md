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

Connect Explorer registers asset modules in its composition root using `@trezor/network-assets-types`.
Suite network modules delegate their nested `icon.getIcons` service to the same asset modules;
token logo identifier resolution stays in the Suite network services. Monero and Tezos have
asset packages without being registered as Suite wallet networks.

Native coin and network components read the registered asset modules through dependency
injection. Each module keeps literal SVG references for bundler discovery; raw asset files are
private to that package. Testnet styling metadata also comes from the asset module.

The vault icon publisher reads native Ethereum coin SVG contents through the asset package's
Node tooling service. General UI icons, token defaults, and payment logos keep their existing
pipeline in this package.

## In case some icons are not rendering correctly in icon font

1. Copy a whole path from the SVG file of the problematic icon.
2. Open `https://yqnn.github.io/svg-path-editor/` and paste the path there.
3. Select the problematic segment in the _Commands_ section and fix it by running _Reverse Subpath_.
4. Check the _Minify output_ checkbox and copy&paste the fixed path back into the SVG file.
5. Regenerate icons with `yarn generate-icons`.
