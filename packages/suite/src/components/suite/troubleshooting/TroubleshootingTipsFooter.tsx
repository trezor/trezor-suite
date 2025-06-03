import { Button, Flex, Text, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';

import { useExternalLink } from '../../../hooks/suite';
import { Translation } from '../Translation';

export const TroubleshootingTipsFooter = () => {
    const href = useExternalLink(TREZOR_SUPPORT_DEVICE_URL);
    const isMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

    return (
        <Flex
            direction={isMobile ? 'column' : 'row'}
            justifyContent="space-between"
            gap={spacings.xs}
            alignItems="center"
            margin={{ horizontal: spacings.sm }}
        >
            <Text typographyStyle="body">
                <Translation id="TR_ONBOARDING_TROUBLESHOOTING_FAILED" />
            </Text>

            <Button variant="tertiary" size="small" href={href}>
                <Translation id="TR_CONTACT_SUPPORT" />
            </Button>
        </Flex>
    );
};
