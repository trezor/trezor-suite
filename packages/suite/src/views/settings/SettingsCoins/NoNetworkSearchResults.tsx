import { Translation } from '@suite/intl';
import { Column, H4, Paragraph } from '@trezor/components';

type NoNetworkSearchResultsProps = {
    dataTestId?: string;
};

export const NoNetworkSearchResults = ({
    dataTestId = '@settings-coins/no-networks-found',
}: NoNetworkSearchResultsProps) => (
    <Column alignItems="center">
        <H4 typographyStyle="body-md" intent="neutral" align="center" data-testid={dataTestId}>
            <Translation id="TR_NO_NETWORKS_FOUND" />
        </H4>
        <Paragraph
            align="center"
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            textWrap="balance"
        >
            <Translation id="TR_NO_NETWORKS_FOUND_DESCRIPTION" />
        </Paragraph>
    </Column>
);
