import { createConfig } from '../../scripts/build/tsdown.shared.mjs';

export default createConfig({ entry: ['src/index.ts'], inlineDevDepTypes: true });
