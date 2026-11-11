import { Translation } from '@suite/intl';
import { BlurUrls } from '@trezor/components';

type TxSimulationMaskedTextProps = {
    text: string;
};

/** Simulated assets have no metadata to vouch for them, so URLs in their text are always masked. */
export const TxSimulationMaskedText = ({ text }: TxSimulationMaskedTextProps) => (
    <BlurUrls text={text} tooltipContent={<Translation id="TR_URL_IN_TOKEN" />} />
);
