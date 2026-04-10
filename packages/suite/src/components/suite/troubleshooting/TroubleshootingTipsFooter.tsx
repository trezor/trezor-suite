import { Translation } from '@suite/intl';
import { Button, Flex, Text, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';

import { useExternalLink } from 'src/hooks/suite';

export const TroubleshootingTipsFooter = () => {
    const href = useExternalLink(TREZOR_SUPPORT_DEVICE_URL);
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

    return (
        <Flex
            direction={isMobile ? 'column' : 'row'}
            justifyContent="space-between"
            gap={spacings.xs}
            alignItems="center"
            width="100%"
        >
            <Text typographyStyle="body-sm">
                <Translation id="TR_ONBOARDING_TROUBLESHOOTING_FAILED" />
            </Text>

            <Button intent="neutral" priority="secondary" href={href}>
                <Translation id="TR_CONTACT_SUPPORT" />
            </Button>
        </Flex>
    );
};
