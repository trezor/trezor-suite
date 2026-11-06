import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BlurUrls, type BlurUrlsProps } from '@trezor/components';
import { type OptionalKey } from '@trezor/type-utils';

type TokenUrlBlurProps = OptionalKey<BlurUrlsProps, 'tooltipContent'> & {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
};

export const TokenUrlBlur = ({
    text,
    networkSymbol,
    tokenContract,
    tooltipContent = <Translation id="TR_URL_IN_TOKEN" />,
}: TokenUrlBlurProps) => {
    const isRecognized = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, networkSymbol, tokenContract),
    );

    return isRecognized ? text : <BlurUrls text={text} tooltipContent={tooltipContent} />;
};
