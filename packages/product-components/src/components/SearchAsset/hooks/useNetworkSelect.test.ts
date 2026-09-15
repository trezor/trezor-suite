import { renderHook } from '@testing-library/react';

import { type SearchAssetSelectConfig, useNetworkSelect } from './useNetworkSelect';

it('uses supplied labels and excludes the selected network from the menu', () => {
    const config: SearchAssetSelectConfig = {
        networks: [
            { symbol: 'btc', name: 'Custom Bitcoin label' },
            { symbol: 'eth', name: 'Custom Ethereum label' },
        ],
        selectedNetwork: 'btc',
        onChange: () => {},
        includeAllOption: true,
        allLabel: 'Every network',
    };
    const { result, rerender } = renderHook(useNetworkSelect, { initialProps: config });

    expect(result.current.selectedOption).toEqual({ label: 'Custom Bitcoin label', value: 'btc' });
    expect(result.current.options).toEqual([
        { label: 'Every network', value: undefined },
        { label: 'Custom Ethereum label', value: 'eth' },
    ]);

    rerender({ ...config, selectedNetwork: undefined });
    expect(result.current.options).toHaveLength(2);
    expect(result.current.selectedOption?.label).toBe('Every network');
});
