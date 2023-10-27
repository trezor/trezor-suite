import { DeviceScreenAddress } from './DeviceScreenAddress';
import { ReceiveTextHint } from './ReceiveTextHint';

type UnverifiedAddressSectionProps = {
    address: string;
    isAddressVisible: boolean;
};

export const UnverifiedAddressSection = ({
    address,
    isAddressVisible,
}: UnverifiedAddressSectionProps) => {
    const isPortfolioTracker = false;

    return isPortfolioTracker ? (
        <ReceiveTextHint />
    ) : (
        // isDevice : {
        <DeviceScreenAddress
            address={address}
            isAddressVisible={isAddressVisible}
            // onAddressConfirm={}
        />
    );
};
