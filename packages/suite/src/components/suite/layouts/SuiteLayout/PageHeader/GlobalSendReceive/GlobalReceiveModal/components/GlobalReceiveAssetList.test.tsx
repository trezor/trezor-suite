import { Fragment, type PropsWithChildren, type ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { type AssetItemProps } from '@suite/assets';
import { type AssetId, getAssetKey, toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { mock } from '@trezor/dependency-injection';
import { BigNumber } from '@trezor/utils';

import { GlobalReceiveAssetList } from './GlobalReceiveAssetList';

type MockAssetsListProps = { items: unknown[]; renderItem: (item: unknown) => ReactNode };
type MockGroupLabelProps = { label: string };

jest.mock('@suite/assets', () => ({
    ASSET_ITEM_HEIGHT: 68,
    AssetItem: ({
        assetId,
        cryptoAmount,
        fiatAmount,
        isDisabled,
        onClick,
        'data-testid': testId,
    }: AssetItemProps) => (
        <button
            type="button"
            disabled={isDisabled}
            data-testid={testId}
            data-asset-id={getAssetKey(assetId)}
            data-crypto-amount={cryptoAmount?.toFixed()}
            data-fiat-amount={fiatAmount?.toFixed()}
            onClick={() => onClick(assetId)}
        />
    ),
}));
jest.mock('@trezor/components', () => ({
    TOOLTIP_DELAY_NORMAL: 0,
    Tooltip: ({ children }: PropsWithChildren) => children,
}));
jest.mock('#src/components/suite/asset-picker/components/AssetsList/AssetsList', () => ({
    AssetsList: ({ items, renderItem }: MockAssetsListProps) => (
        <>
            {items.map((item, index) => (
                <Fragment key={index}>{renderItem(item)}</Fragment>
            ))}
        </>
    ),
}));
jest.mock('#src/components/suite/asset-picker/components/AssetRow/AssetGroupLabel', () => ({
    AssetGroupLabel: ({ label }: MockGroupLabelProps) => <div>{label}</div>,
}));
jest.mock('#src/components/suite/asset-picker/components/AssetRow/AssetGroupSpace', () => ({
    AssetGroupSpace: () => null,
}));

describe('GlobalReceiveAssetList', () => {
    it('preserves source selection, zero balances, disabled assets and existing test identifiers', () => {
        const bitcoin = { networkSymbol: asNetworkSymbol('btc') };
        const token = {
            networkSymbol: asNetworkSymbol('eth'),
            contractAddress: toTokenAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        };
        const onAssetClick = mock<(asset: AssetId) => void>();
        render(
            <GlobalReceiveAssetList
                myAssets={[
                    {
                        assetId: bitcoin,
                        balance: {
                            cryptoAmount: '0',
                            fiatAmount: asBaseCurrencyAmount(new BigNumber(0)),
                        },
                    },
                ]}
                otherAssets={[{ assetId: token, balance: undefined }]}
                isAssetDisabled={asset => getAssetKey(asset) === getAssetKey(token)}
                disabledMessage={undefined}
                listRef={{ current: null }}
                onAssetClick={onAssetClick}
            />,
        );

        const bitcoinRow = screen.getByTestId(`@global-receive/asset/${getAssetKey(bitcoin)}`);
        const tokenRow = screen.getByTestId(`@global-receive/asset/${getAssetKey(token)}`);
        expect(bitcoinRow.getAttribute('data-asset-id')).toBe(getAssetKey(bitcoin));
        expect(bitcoinRow.getAttribute('data-crypto-amount')).toBe('0');
        expect(bitcoinRow.getAttribute('data-fiat-amount')).toBe('0');
        expect(tokenRow.getAttribute('data-crypto-amount')).toBeNull();
        fireEvent.click(bitcoinRow);
        expect(onAssetClick).toHaveBeenCalledWith(bitcoin);
        expect(onAssetClick.mock.calls[0]?.[0]).toBe(bitcoin);
        fireEvent.click(tokenRow);
        expect(onAssetClick).toHaveBeenCalledTimes(1);
    });
});
