import { memo } from 'react';
import { Pressable } from 'react-native';

import { Card, CardDivider, FullAlertBox, FullAlertBoxProps, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { CardContent } from './CardContent';
import { CardHeader } from './CardHeader';
import { WalletBackupType } from '../WalletBackupSheet';
import { walletBackupSheetCopyByType } from '../presets';

interface WalletTypeCardProps {
    type: WalletBackupType;
    isSelected: boolean;
    setSelectedType: (type: WalletBackupType) => void;
    isVisible: boolean;
}

const containerStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    borderColor: isSelected ? utils.colors.borderSecondary : 'transparent',
    borderWidth: utils.borders.widths.large,
}));

const variantByWalletBackupType: Record<WalletBackupType, FullAlertBoxProps['variant']> = {
    'shamir-single': 'success',
    'shamir-advanced': 'warning',
    '12-words': 'neutral',
    '24-words': 'neutral',
};

export const WalletBackupCard = memo(
    ({ type, isVisible, isSelected, setSelectedType }: WalletTypeCardProps) => {
        const { applyStyle } = useNativeStyles();
        const { translate } = useTranslate();
        const openLink = useOpenLink();

        const handleLearnMorePress = () => {
            openLink(HELP_CENTER_MULTI_SHARE_BACKUP_URL);
        };

        const selectCard = () => {
            setSelectedType(type);
        };

        if (!isVisible) return null;

        return (
            <Pressable onPress={selectCard}>
                <Card style={applyStyle(containerStyle, { isSelected })}>
                    <VStack spacing="sp16">
                        <CardHeader isSelected={isSelected} type={type} />
                        <CardDivider horizontalPadding={isSelected ? 'sp16' : 'sp18'} />
                        <CardContent type={type} />
                        <FullAlertBox
                            variant={variantByWalletBackupType[type]}
                            title={translate(walletBackupSheetCopyByType[type].calloutLabel)}
                            onPressPrimaryButton={handleLearnMorePress}
                            primaryButtonLabel={
                                type === 'shamir-advanced'
                                    ? translate(
                                          'moduleDeviceOnboarding.walletBackupSheet.options.shamir-advanced.alertButtonLabel',
                                      )
                                    : undefined
                            }
                            primaryButtonProps={{
                                viewLeft: 'arrowSquareOut',
                            }}
                        />
                    </VStack>
                </Card>
            </Pressable>
        );
    },
);
