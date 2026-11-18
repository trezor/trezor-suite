import { useTranslation } from '@suite/intl';
import { type FetchIdentityIndex } from '@trezor/coinjoin';

import { CircuitHops } from './CircuitHops';
import { ART, CIRCUIT_LABELS, getReturnPath } from './illustrationData';

type LitCircuitProps = {
    identity: FetchIdentityIndex;
};

// Mounted anew for every light-up, so its animations always start from the beginning.
export const LitCircuit = ({ identity }: LitCircuitProps) => {
    const { translationString } = useTranslation();
    const path = ART.circuits[identity];
    const [labelX, labelY] = CIRCUIT_LABELS[identity];

    return (
        <>
            <g stroke="var(--violet)" strokeWidth="1.3">
                <path className="circuit" d={path} pathLength="1" strokeDasharray="1 1" />
                <CircuitHops path={path} />
            </g>
            <text className="circuit-label" x={labelX} y={labelY} fill="var(--violet)">
                {/* Tor circuit 1 brings the filters, so the fetch identities are circuits 2 to 5. */}
                {translationString('TR_COINJOIN_DISCOVERY_LABEL_TOR_CIRCUIT_NUMBER', {
                    number: identity + 2,
                })}
            </text>
            <g
                className="packet"
                fill="var(--violet)"
                display="none"
                style={{ offsetPath: getReturnPath(path) }}
            >
                <circle r="7" opacity="0.18" />
                <circle r="2.6" />
            </g>
        </>
    );
};
