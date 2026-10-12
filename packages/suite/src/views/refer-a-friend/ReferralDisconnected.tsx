import { toggleConnectionModal } from '@suite/device';
import { Translation } from '@suite/intl';
import { Button, Card, Column, H2, Illustration, Paragraph } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const ReferralDisconnected = () => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <Card paddingType="none" data-testid="@referral/disconnected">
            <Column padding={{ vertical: 32, horizontal: 16 }} alignItems="center">
                <Column width="100%" maxWidth={480} gap={24} alignItems="center">
                    <Column width="100%" maxWidth={350}>
                        <Illustration name="megaphone" width="100%" />
                    </Column>
                    <Column alignItems="center" gap={8}>
                        <H2 typographyStyle="headline-md" align="center">
                            <Translation id="TR_REFERRAL_INVITATION_TITLE" />
                        </H2>
                        <Paragraph
                            typographyStyle="body-md"
                            intent="neutral"
                            priority="secondary"
                            align="center"
                        >
                            <Translation id="TR_REFERRAL_CONNECT_DESCRIPTION" />
                        </Paragraph>
                    </Column>
                    <Button
                        size="large"
                        minWidth={180}
                        onClick={() => dispatch(toggleConnectionModal())}
                        data-testid="@referral/disconnected/connect"
                    >
                        <Translation id="TR_CONNECT" />
                    </Button>
                </Column>
            </Column>
        </Card>
    );
};
