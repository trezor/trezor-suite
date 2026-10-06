import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { BannerInline, type BannerInlineProps, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type ReceiveAddressInfoProps = {
    networkSymbol: NetworkSymbol;
    isTokenAddress: boolean;
};

export const ReceiveAddressInfo = ({ networkSymbol, isTokenAddress }: ReceiveAddressInfoProps) => {
    const { name: networkName } = getNetwork(networkSymbol);

    const getAlertProps = (): BannerInlineProps | undefined => {
        if (networkSymbol === 'ada') {
            return {
                title: (
                    <Translation id="moduleReceive.receiveAddressCard.alert.longCardanoAddress" />
                ),
                intent: 'info',
            };
        }

        if (networkSymbol === 'eth') {
            return {
                title: (
                    <Translation id="moduleReceive.receiveAddressCard.alert.sharedAssetsAndTokens" />
                ),
                intent: 'info',
            };
        }

        if (isTokenAddress) {
            return {
                title: (
                    <Translation
                        id="moduleReceive.receiveAddressCard.alert.token"
                        values={{ networkName }}
                    />
                ),
                intent: 'info',
            };
        }

        return undefined;
    };

    const alertProps = getAlertProps();

    if (!alertProps) {
        return null;
    }

    return (
        <Box marginBottom="sp4">
            <BannerInline {...alertProps} />
        </Box>
    );
};
