import { Translation, useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    Banner,
    Box,
    Button,
    Column,
    H2,
    Icon,
    Input,
    Menu,
    Popover,
    Row,
    SvgImage,
    Text,
    Tooltip,
    usePopoverContext,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';
import {
    EnvelopeIcon,
    FacebookLogoIcon,
    InfoIcon,
    InstagramLogoIcon,
    LinkIcon,
    ShareNetworkIcon,
    TelegramLogoIcon,
    TwitterLogoAltIcon,
    WhatsappLogoIcon,
} from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

const shareOptions = [
    { name: 'WhatsApp', icon: WhatsappLogoIcon },
    { name: 'Telegram', icon: TelegramLogoIcon },
    { name: 'X', icon: TwitterLogoAltIcon },
    { name: 'Facebook', icon: FacebookLogoIcon },
    { name: 'Instagram', icon: InstagramLogoIcon },
];

const ReferralShareMenu = () => {
    const { setOpen } = usePopoverContext();

    return (
        <Menu
            minWidth={200}
            onClose={() => setOpen(false)}
            items={[
                ...shareOptions.map(({ name, icon }) => ({
                    label: name,
                    icon,
                    'data-testid': `@referral/share/${name.toLowerCase()}`,
                })),
                {
                    label: <Translation id="TR_REFERRAL_SHARE_EMAIL" />,
                    icon: EnvelopeIcon,
                    'data-testid': '@referral/share/email',
                },
            ]}
        />
    );
};

type ReferralLinkCardProps = {
    referralLink: string;
    rewardAmount: string;
    minimumOrderAmount: string;
    friendDiscountPercentage: number;
    annualReferralLimit: number;
    annualRewardLimit: string;
    doubleRewardAmount: string;
    doubleRewardReferralLimit: number;
    rewardWaitingPeriodDays: number;
    nextResetDate: string;
    isLimitReached: boolean;
};

export const ReferralLinkCard = ({
    referralLink,
    isLimitReached,
    ...values
}: ReferralLinkCardProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const copyLink = async () => {
        const result = await copyToClipboard(referralLink);
        dispatch(
            notificationsActions.addToast(
                result === true
                    ? { type: 'copy-to-clipboard' }
                    : { type: 'error', error: translationString('TR_REFERRAL_COPY_FAILED') },
            ),
        );
    };

    return (
        <Box
            backgroundColor="surfaceFillBrandBold"
            borderRadius={16}
            padding={{ top: 16, bottom: 20, horizontal: 20 }}
            data-testid="@referral/link-card"
            height={220}
            position={{ type: 'relative' }}
        >
            <Box
                position={{ type: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                pointerEvents="none"
                zIndex={0}
            >
                <SvgImage
                    color="elementFillOnDarkBoldDisabled"
                    image="REFERRAL_PATTERN"
                    width="100%"
                    height="100%"
                />
            </Box>
            <Column
                justifyContent="space-between"
                alignItems="stretch"
                height="100%"
                position={{ type: 'relative' }}
                zIndex={1}
            >
                <Column>
                    <H2 typographyStyle="headline-md" color="contentOnDarkPrimaryInverse">
                        <Translation id="TR_REFERRAL_INVITATION_TITLE" />
                    </H2>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_REFERRAL_SHARE_DESCRIPTION" values={values} />
                    </Text>
                </Column>
                {isLimitReached ? (
                    <Box backgroundColor="surfaceFillRaised" borderRadius={8}>
                        <Tooltip
                            content={<Translation id="TR_REFERRAL_LIMIT_TOOLTIP" values={values} />}
                            placement="bottom"
                        >
                            <Banner
                                intent="neutral"
                                data-testid="@referral/limit-reached"
                                description={
                                    <Translation id="TR_REFERRAL_LIMIT_REACHED" values={values} />
                                }
                                icon={InfoIcon}
                            />
                        </Tooltip>
                    </Box>
                ) : (
                    <Row gap={16}>
                        <Box
                            backgroundColor="surfaceFillRaised"
                            borderRadius={12}
                            flex="1"
                            minWidth={0}
                        >
                            <Input
                                value={referralLink}
                                readOnly
                                aria-label={translationString('TR_REFERRAL_LINK')}
                                leftContent={
                                    <Icon
                                        as={LinkIcon}
                                        size={20}
                                        intent="neutral"
                                        priority="secondary"
                                    />
                                }
                                size="medium"
                                data-testid="@referral/link"
                            />
                        </Box>
                        <Row gap={8}>
                            <Button
                                intent="neutral"
                                size="large"
                                onClick={copyLink}
                                data-testid="@referral/copy-link"
                            >
                                <Translation id="TR_REFERRAL_COPY_LINK" />
                            </Button>
                            <Popover
                                placement={{ position: 'bottom', alignment: 'end' }}
                                content={<ReferralShareMenu />}
                            >
                                <Button
                                    intent="neutral"
                                    priority="secondary"
                                    size="large"
                                    isFloating
                                    iconLeft={ShareNetworkIcon}
                                    data-testid="@referral/share"
                                >
                                    <Translation id="TR_REFERRAL_SHARE" />
                                </Button>
                            </Popover>
                        </Row>
                    </Row>
                )}
            </Column>
        </Box>
    );
};
