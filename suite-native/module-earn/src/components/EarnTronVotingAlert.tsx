import { Box, InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const alertStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
    marginBottom: utils.spacings.sp12,
}));

interface EarnTronVotingAlertProps {
    votesRemaining: string;
}

export const EarnTronVotingAlert = ({ votesRemaining }: EarnTronVotingAlertProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(alertStyle)}>
            <InlineAlertBox
                intent="warning"
                title={
                    <Translation id="earn.tron.votesAlertText" values={{ count: votesRemaining }} />
                }
            />
        </Box>
    );
};
