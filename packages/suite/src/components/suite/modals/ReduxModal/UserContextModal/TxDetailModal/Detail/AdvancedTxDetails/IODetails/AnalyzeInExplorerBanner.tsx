import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBlockchainExplorerBySymbol } from '@suite-common/wallet-core';
import { Banner, Column, H4, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useExternalLink, useSelector } from 'src/hooks/suite';

type AnalyzeInExplorerBannerProps = {
    txid: string;
    symbol: NetworkSymbol;
};

export const AnalyzeInExplorerBanner = ({ txid, symbol }: AnalyzeInExplorerBannerProps) => {
    const explorer = useSelector(state => selectBlockchainExplorerBySymbol(state, symbol));
    const href = useExternalLink(`${explorer?.tx}${txid}${explorer.queryString ?? ''}`);

    return (
        <Banner
            variant="info"
            icon="cube"
            rightContent={
                <Banner.Button icon="arrowUpRight" iconAlignment="right" size="small" href={href}>
                    <Translation id="TR_ANALYZE_IN_EXPLORER_OPEN" />
                </Banner.Button>
            }
        >
            <Column>
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
