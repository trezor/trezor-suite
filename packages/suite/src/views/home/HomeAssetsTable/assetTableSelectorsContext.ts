import { createContext, useContext } from 'react';

import { type AssetTableSelectors, homeAssetTableSelectors } from '@suite-common/assets';

const AssetTableSelectorsContext = createContext<AssetTableSelectors>(homeAssetTableSelectors);

export const AssetTableSelectorsProvider = AssetTableSelectorsContext.Provider;

export const useAssetTableSelectors = () => useContext(AssetTableSelectorsContext);
