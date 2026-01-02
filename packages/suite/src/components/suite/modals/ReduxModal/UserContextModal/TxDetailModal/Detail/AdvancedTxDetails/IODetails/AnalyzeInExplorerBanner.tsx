import { Explorer, NetworkSymbol } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectExplorer } from '@suite-common/wallet-core';
import { Banner, Column, H4, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useExternalLink, useSelector } from 'src/hooks/suite';

type AnalyzeInExplorerBannerProps = {
    txid: string;
    symbol: NetworkSymbol;
};

export const AnalyzeInExplorerBanner = ({ txid, symbol }: AnalyzeInExplorerBannerProps) => {
    const explorer = useSelector(state => selectExplorer(state, symbol)) as Explorer;
    const href = useExternalLink(
        `${getExplorerUrl(explorer, 'tx')}${txid}${explorer.queryString ?? ''}`,
    );

    return (
        <Banner
            intent="info"
            icon="cube"
            rightContent={
                <Banner.Button iconRight="arrowUpRight" size="small" href={href}>
                    <Translation id="TR_ANALYZE_IN_EXPLORER_OPEN" />
                </Banner.Button>
            }
        >
            <Column>
                <H4>
                    <Translation id="TR_ANALYZE_IN_EXPLORER" />
                </H4>
                <Paragraph>
                    <Translation id="TR_ANALYZE_IN_EXPLORER_DESC" />
                </Paragraph>
            </Column>
        </Banner>
    );
};
