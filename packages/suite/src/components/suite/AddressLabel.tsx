import { selectSuiteSyncAddressLabels } from '@suite-common/suite-sync';
import { Account } from '@suite-common/wallet-types';
import { Text, TextProps } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';

import { Address } from './Address';

type AddressLabelProps = {
    account: Account;
    address: string;
    typographyStyle?: TextProps['typographyStyle'];
    variant?: TextProps['variant'];
};

export const AddressLabel = ({ account, address, typographyStyle, variant }: AddressLabelProps) => {
    const { addressLabels } = useSelector(state =>
        selectLabelingDataForAccount(state, account.key),
    );
    const suiteSyncAddressLabels = useSelector(state =>
        selectSuiteSyncAddressLabels(state, account.deviceState),
    );
    const addressLabel =
        suiteSyncAddressLabels.find(it => it.address === address)?.label ?? addressLabels[address];

    return addressLabel ? (
        <Text typographyStyle={typographyStyle} variant={variant}>
            {addressLabel}
        </Text>
    ) : (
        <Address
            typographyStyle={typographyStyle}
            variant={variant}
            value={address}
            isTruncated={true}
        />
    );
};
