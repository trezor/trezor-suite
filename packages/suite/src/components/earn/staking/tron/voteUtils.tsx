import { CUSTOM_REPRESENTATIVE } from './vote/constants';
import { formatApyValue } from '../../utils/earnApyUtils';

interface VotedRepresentativeFields {
    representative: string;
    customRepresentativeAddress: string;
}

export const resolveVotedRepresentativeAddress = ({
    representative,
    customRepresentativeAddress,
}: VotedRepresentativeFields): string =>
    representative === CUSTOM_REPRESENTATIVE ? customRepresentativeAddress.trim() : representative;

export const formatApr = (apr: number | undefined) =>
    apr != null ? `${formatApyValue(apr)}%` : formatApyValue(apr);
