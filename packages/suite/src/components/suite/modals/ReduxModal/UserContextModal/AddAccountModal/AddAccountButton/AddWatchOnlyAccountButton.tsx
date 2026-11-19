import { type Network } from '@suite-common/wallet-config';

import { AddButton } from './AddButton';

type AddWatchOnlyAccountButtonProps = {
    network: Network;
    address: string | undefined;
    onAddWatchOnlyAccount: (address: string) => void;
    isLoading?: boolean;
};

export const AddWatchOnlyAccountButton = ({
    network,
    address,
    onAddWatchOnlyAccount,
    isLoading,
}: AddWatchOnlyAccountButtonProps) => (
    <AddButton
        disabledMessage={null}
        isDisabled={!address}
        networkName={network.name}
        onClick={() => address && onAddWatchOnlyAccount(address)}
        isLoading={isLoading}
    />
);
