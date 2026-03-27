import { Badge, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { IconWithSpinner } from '@suite-native/trading-atoms';
import type { ConfirmationVariant } from '@suite-native/trading-types';
import { exhaustive } from '@trezor/type-utils';

export type ExchangeConfirmationTitleProps = {
    variant: ConfirmationVariant;
};

const TitleTranslation = ({ variant }: { variant: ConfirmationVariant }) => {
    switch (variant) {
        case 'approve':
            return <Translation id="moduleTrading.tradingConfirmationScreen.approveTitle" />;
        case 'revoke':
            return <Translation id="moduleTrading.tradingConfirmationScreen.revokeTitle" />;
        default:
            return exhaustive(variant);
    }
};

export const ExchangeConfirmationTitle = ({ variant }: ExchangeConfirmationTitleProps) => (
    <VStack spacing="sp16" paddingVertical="sp16" alignItems="center">
        <IconWithSpinner iconName="arrowUp" />
        <Badge
            label={<Translation id="moduleTrading.tradingConfirmationScreen.pending" />}
            size="medium"
            variant="yellow"
        />
        <VStack spacing="sp6" alignItems="center">
            <Text variant="headline-md">
                <TitleTranslation variant={variant} />
            </Text>
            <Text color="textSubdued">
                <Translation id="moduleTrading.tradingConfirmationScreen.subtitle" />
            </Text>
        </VStack>
    </VStack>
);
