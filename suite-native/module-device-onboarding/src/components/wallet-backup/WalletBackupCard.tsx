import { memo } from 'react';
import { Pressable } from 'react-native';

import { Card, CardDivider, FullAlertBox } from '@suite-native/atoms';
import { FullAlertProps } from '@suite-native/atoms/src/FullAlertBox/types';
import { useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HELP_CENTER_MULTI_SHARE_BACKUP_URL } from '@trezor/urls';

import { CardContent } from './CardContent';
import { CardHeader } from './CardHeader';
import { WalletBackupType } from './WalletBackupSheet';

interface WalletTypeCardProps {
    type: WalletBackupType;
    isSelected: boolean;
    setSelectedType: (type: WalletBackupType) => void;
    isVisible: boolean;
}

const containerStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    marginTop: utils.spacings.sp16,
    borderColor: isSelected ? utils.colors.borderSecondary : 'transparent',
    borderWidth: utils.borders.widths.large,
}));

const variantByWalletBackupType: Record<WalletBackupType, FullAlertProps['variant']> = {
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
                    <CardHeader isSelected={isSelected} type={type} />
                    <CardDivider horizontalPadding="sp24" />
                    <CardContent type={type} />
                    <FullAlertBox
                        marginTop="sp16"
                        variant={variantByWalletBackupType[type]}
                        title={translate(
                            `moduleDeviceOnboarding.walletBackupSheet.options.${type}.callout`,
                        )}
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
                </Card>
            </Pressable>
        );
    },
);
