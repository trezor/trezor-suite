import { exhaustive } from '@trezor/type-utils';

import { AssetGroupLabel } from './AssetGroupLabel';
import { AssetGroupSpace } from './AssetGroupSpace';
import { AssetRowProps } from '../../constants';
import { AssetRowAccount } from './AssetRowAccount/AssetRowAccount';
import { AssetRowAsset } from './AssetRowAsset/AssetRowAsset';

export function AssetRow(props: AssetRowProps) {
    switch (props.type) {
        case 'group-space-lg':
        case 'group-space-md':
            return <AssetGroupSpace type={props.type} />;

        case 'group-label':
            return <AssetGroupLabel {...props.data} />;

        case 'asset':
            return <AssetRowAsset {...props.data} />;

        case 'account':
            return <AssetRowAccount {...props.data} onClick={props.onClick} />;

        default:
            // @ts-expect-error
            exhaustive(props.type);

            return null;
    }
}
