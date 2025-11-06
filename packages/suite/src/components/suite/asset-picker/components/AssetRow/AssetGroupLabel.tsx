import { Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

import { AssetRowGroupLabelDataProps } from '../../constants';

export type AssetGroupLabelProps = AssetRowGroupLabelDataProps;

export function AssetGroupLabel({ label }: AssetGroupLabelProps) {
    return (
        <Text typographyStyle="hint" variant="default" margin={{ bottom: spacings.xxs }}>
            <Translation id={label} />
        </Text>
    );
}
