import { Banner, Paragraph, H4, Column } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBlockchainExplorerBySymbol } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';

type AnalyzeInExplorerBannerProps = {
    txid: string;
    symbol: NetworkSymbol;
};

export const AnalyzeInExplorerBanner = ({ txid, symbol }: AnalyzeInExplorerBannerProps) => {
    const explorer = useSelector(state => selectBlockchainExplorerBySymbol(state, symbol));

    return (
        <Banner
            variant="info"
            icon="cube"
            rightContent={
                <Banner.Button
                    icon="arrowUpRight"
                    iconAlignment="right"
                    size="small"
                    href={`${explorer?.tx}${txid}${explorer.queryString ?? ''}`}
                >
                    <Translation id="TR_ANALYZE_IN_EXPLORER_OPEN" />
                </Banner.Button>
            }
        >
            <Column alignItems="center">
                <H4>
                    <Translation id="TR_ANALYZE_IN_EXPLORER" />
                </H4>
                <Paragraph variant="tertiary">
                    <Translation id="TR_ANALYZE_IN_EXPLORER_DESC" />
                </Paragraph>
            </Column>
        </Banner>
    );
};
