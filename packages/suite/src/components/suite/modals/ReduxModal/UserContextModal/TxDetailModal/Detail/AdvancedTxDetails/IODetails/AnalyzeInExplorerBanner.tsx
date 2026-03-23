import { Translation } from '@suite/intl';
import { type Explorer, type NetworkSymbol } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectExplorer } from '@suite-common/wallet-core';
import { Banner } from '@trezor/components';

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
            title={<Translation id="TR_ANALYZE_IN_EXPLORER" />}
            description={<Translation id="TR_ANALYZE_IN_EXPLORER_DESC" />}
            rightContent={
                <Banner.Button size="small" href={href}>
                    <Translation id="TR_ANALYZE_IN_EXPLORER_OPEN" />
                </Banner.Button>
            }
        />
    );
};
