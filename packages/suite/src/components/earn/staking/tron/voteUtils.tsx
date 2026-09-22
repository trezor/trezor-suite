import { CUSTOM_REPRESENTATIVE } from './vote/constants';

interface VotedRepresentativeFields {
    representative: string;
    customRepresentativeAddress: string;
}

export const resolveVotedRepresentativeAddress = ({
    representative,
    customRepresentativeAddress,
}: VotedRepresentativeFields): string =>
    representative === CUSTOM_REPRESENTATIVE ? customRepresentativeAddress.trim() : representative;
