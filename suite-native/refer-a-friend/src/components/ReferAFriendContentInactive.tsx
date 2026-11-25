import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import {
    type ReferralProgramData,
    selectDoesReferralExistOnlyForOtherWallets,
} from '@suite-common/refer-a-friend';
import { useAlert } from '@suite-native/alerts';
import { BannerFull, Box, Button, Text, TextButton, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { DATA_PRIVACY_URL, TREZOR_TOS_REFER_A_FRIEND_URL, TREZOR_TOS_URL } from '@trezor/urls';

import { FaqCollapsibleCard } from './FaqCollapsibleCard';
import { HowItWorksCollapsibleCard } from './HowItWorksCollapsibleCard';
import { VoucherCard } from './VoucherCard';
import { useJoinReferAFriendProgram } from '../hooks/useJoinReferAFriendProgram';

type ReferAFriendContentInactiveProps = {
    programData: ReferralProgramData;
};

type TermsLinkProps = {
    href: string;
    label: ReactNode;
};

const textButtonStyle = prepareNativeStyle(_ => ({ alignSelf: 'flex-start' }));

const TermsLink = ({ href, label }: TermsLinkProps) => (
    <Link
        href={href}
        label={label}
        textVariant="body-sm"
        textColor="contentTertiary"
        isUnderlined
    />
);

export const ReferAFriendContentInactive = ({ programData }: ReferAFriendContentInactiveProps) => {
    const { applyStyle } = useNativeStyles();
    const { showAlert } = useAlert();

    const isReferralActiveForDifferentBackup = useSelector(
        selectDoesReferralExistOnlyForOtherWallets,
    );

    const joinReferAFriendProgram = useJoinReferAFriendProgram();

    const showTheyGetAlert = () => {
        showAlert({
            title: <Translation id="referAFriend.voucherCard.theyGet.label" />,
            description: (
                <Translation
                    id="referAFriend.voucherCard.theyGet.description"
                    values={programData}
                />
            ),
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
        });
    };

    return (
        <VStack spacing="sp16">
            <Box marginHorizontal="sp12" marginVertical="sp4">
                <VoucherCard>
                    <VStack spacing="sp16">
                        <Box>
                            <Text variant="body-sm" color="contentOnDarkBrand">
                                <Translation id="referAFriend.voucherCard.youGet.label" />
                            </Text>
                            <Text variant="headline-sm" color="contentOnDarkBrand">
                                <Translation
                                    id="referAFriend.voucherCard.youGet.voucher"
                                    values={programData}
                                />
                            </Text>
                        </Box>
                        <Box>
                            <TextButton
                                onPress={showTheyGetAlert}
                                iconRight="question"
                                intent="brand"
                                priority="primary"
                                isInverse
                                isUnderlined
                                style={applyStyle(textButtonStyle)}
                            >
                                <Translation id="referAFriend.voucherCard.theyGet.label" />
                            </TextButton>
                            <Text variant="headline-sm" color="contentOnDarkBrand">
                                <Translation
                                    id="referAFriend.voucherCard.theyGet.discount"
                                    values={programData}
                                />
                            </Text>
                        </Box>
                    </VStack>
                </VoucherCard>
            </Box>
            <VStack marginBottom="sp8" spacing="sp16">
                <Button onPress={joinReferAFriendProgram}>
                    <Translation id="referAFriend.buttons.joinProgram" />
                </Button>
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
            </VStack>
            {isReferralActiveForDifferentBackup && (
                <BannerFull
                    title={<Translation id="referAFriend.differentWalletBackup.title" />}
                    description={
                        <Translation id="referAFriend.differentWalletBackup.description" />
                    }
                    intent="info"
                />
            )}
            <HowItWorksCollapsibleCard programData={programData} />
            <FaqCollapsibleCard programData={programData} />
        </VStack>
    );
};
