import { type ReactNode } from 'react';

import { useAlert } from '@suite-native/alerts';
import { Box, Button, Text, TextButton, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { useNativeStyles } from '@trezor/styles-native';
import { DATA_PRIVACY_URL, TREZOR_TOS_REFER_A_FRIEND_URL, TREZOR_TOS_URL } from '@trezor/urls';

import { FaqCollapsibleCard } from './FaqCollapsibleCard';
import { HowItWorksCollapsibleCard } from './HowItWorksCollapsibleCard';
import { VoucherCard } from './VoucherCard';
import { useReferAFriend } from '../hooks/useReferAFriend';

const TermsLink = ({ href, label }: { href: string; label: ReactNode }) => (
    <Link
        href={href}
        label={label}
        textVariant="body-sm"
        textColor="contentTertiary"
        isUnderlined
    />
);

export const ReferAFriendContent = () => {
    const { showAlert } = useAlert();
    const { applyStyle } = useNativeStyles();

    // TODO: pass as props?
    const { rewardAmount, friendDiscountPercentage, minimumOrderAmount } = useReferAFriend();

    return (
        <VStack spacing="sp16">
            <Box paddingHorizontal="sp12" paddingBottom="sp4">
                <VoucherCard>
                    <Box alignContent="flex-start">
                        <VStack spacing="sp16">
                            <Box>
                                <Text variant="body-sm" color="contentOnDarkBrand">
                                    <Translation id="referAFriend.voucher.youGet.label" />
                                </Text>
                                <Text variant="headline-sm" color="contentOnDarkBrand">
                                    <Translation
                                        id="referAFriend.voucher.youGet.voucher"
                                        values={{ rewardAmount }}
                                    />
                                </Text>
                            </Box>
                            <Box>
                                <TextButton
                                    onPress={() =>
                                        showAlert({
                                            title: (
                                                <Translation id="referAFriend.voucher.theyGet.label" />
                                            ),
                                            description: (
                                                <Translation
                                                    id="referAFriend.voucher.theyGet.description"
                                                    values={{
                                                        friendDiscountPercentage,
                                                        minimumOrderAmount,
                                                    }}
                                                />
                                            ),
                                            primaryButtonTitle: (
                                                <Translation id="generic.buttons.gotIt" />
                                            ),
                                        })
                                    }
                                    iconRight="question"
                                    intent="brand"
                                    priority="primary"
                                    isInverse
                                    isUnderlined
                                    style={{ alignSelf: 'flex-start' }}
                                >
                                    <Translation id="referAFriend.voucher.theyGet.label" />
                                </TextButton>
                                <Text variant="headline-sm" color="contentOnDarkBrand">
                                    <Translation
                                        id="referAFriend.voucher.theyGet.discount"
                                        values={{ friendDiscountPercentage }}
                                    />
                                </Text>
                            </Box>
                        </VStack>
                    </Box>
                </VoucherCard>
            </Box>
            <Button>Join program</Button>
            <Box paddingBottom="sp8">
                <Text variant="body-sm" color="contentTertiary" textAlign="center">
                    <Translation
                        id="referAFriend.terms"
                        values={{
                            privacyPolicy: chunks => (
                                <TermsLink href={DATA_PRIVACY_URL} label={chunks} />
                            ),
                            programTerms: chunks => (
                                <TermsLink href={TREZOR_TOS_REFER_A_FRIEND_URL} label={chunks} />
                            ),
                            generalTerms: chunks => (
                                <TermsLink href={TREZOR_TOS_URL} label={chunks} />
                            ),
                        }}
                    />
                </Text>
            </Box>
            <HowItWorksCollapsibleCard />
            <FaqCollapsibleCard />
        </VStack>
    );
};
