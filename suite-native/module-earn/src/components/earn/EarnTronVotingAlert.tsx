import { useFormatters } from '@suite-common/formatters';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { BannerInline, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const alertStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp16,
    marginBottom: utils.spacings.sp12,
}));

type EarnTronVotingAlertProps = {
    apr: number | null;
    votesRemaining: string;
};

export const EarnTronVotingAlert = ({ apr, votesRemaining }: EarnTronVotingAlertProps) => {
    const { PercentageFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(alertStyle)}>
            <BannerInline
                intent="info"
                title={
                    apr !== null && isApyAvailable(apr) ? (
                        <Translation
                            id="earn.tron.unassignedVotesApr"
                            values={{ count: votesRemaining, apr: PercentageFormatter.format(apr) }}
                        />
                    ) : (
                        <Translation
                            id="earn.tron.unassignedVotes"
                            values={{ count: votesRemaining }}
                        />
                    )
                }
            />
        </Box>
    );
};
