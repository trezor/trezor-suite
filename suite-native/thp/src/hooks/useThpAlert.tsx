import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { startThpAutoconnectThunk, thpActions } from '@suite-common/thp';
import { useAlert } from '@suite-native/alerts';
import { Box, BulletListItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const useThpAlerts = () => {
    const dispatch = useDispatch();
    const { showAlert } = useAlert();

    const turnOnAutoconnect = useCallback(() => {
        dispatch(startThpAutoconnectThunk());
    }, [dispatch]);

    const ignoreAutoconnect = useCallback(() => {
        dispatch(thpActions.resetThpFlow());
    }, [dispatch]);

    const showThpAutoconnectAlert = useCallback(() => {
        showAlert({
            textAlign: 'left',
            title: <Translation id="thp.autoconnect.title" />,
            description: <Translation id="thp.autoconnect.description" />,
            appendix: (
                <VStack spacing="sp4">
                    <Text variant="highlight">
                        <Translation id="thp.autoconnect.appendix.highlight" />
                    </Text>
                    <Box>
                        <BulletListItem color="textSubdued">
                            <Translation id="thp.autoconnect.appendix.bullet1" />
                        </BulletListItem>
                        <BulletListItem color="textSubdued">
                            <Translation id="thp.autoconnect.appendix.bullet2" />
                        </BulletListItem>
                        <BulletListItem color="textSubdued">
                            <Translation id="thp.autoconnect.appendix.bullet3" />
                        </BulletListItem>
                    </Box>
                </VStack>
            ),
            primaryButtonTitle: <Translation id="thp.autoconnect.turnOnButton" />,
            onPressPrimaryButton: turnOnAutoconnect,
            secondaryButtonTitle: <Translation id="thp.autoconnect.noThanksButton" />,
            onPressSecondaryButton: ignoreAutoconnect,
        });
    }, [showAlert, turnOnAutoconnect, ignoreAutoconnect]);

    return { showThpAutoconnectAlert };
};
