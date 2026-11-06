import { type CSSProperties, useId } from 'react';

import { useTranslation } from '@suite/intl';

import { LitCircuit } from './LitCircuit';
import { IllustrationSvg } from './PrivacyIllustration.styles';
import {
    ART,
    BATCH_COLUMNS,
    BATCH_PATH,
    BLOCK_COLUMNS,
    TRAY_SLOTS,
    UNLIT_PATHS,
    VIEW_BOX,
    getBatchColumnPath,
    getBlockColumnPath,
} from './illustrationData';
import { getDiscoveryCaptions } from '../getDiscoveryCaptions';
import { type DiscoveryIllustrationState } from '../useDiscoveryIllustration';

type PrivacyIllustrationProps = {
    illustration: DiscoveryIllustrationState;
    isReducedMotion: boolean;
};

/**
 * This computer downloads filters over Tor, checks them on the screen and discards what doesn't
 * match; a real fetch lights one of the four Tor circuits. With reduced motion, a still diagram.
 */
export const PrivacyIllustration = ({
    illustration,
    isReducedMotion,
}: PrivacyIllustrationProps) => {
    const { translationString } = useTranslation();
    // Clip path ids are document-global.
    const clipPathId = `privacy-batch-${useId().replace(/[^\w-]/g, '')}`;
    const { stage, activity, isScanning, isFetchOpen, lit, result, keptCount } = illustration;
    const isAnimated = !isReducedMotion;
    // Every caption, once and in order, while the visible caption rotates.
    const description = getDiscoveryCaptions(stage, false)
        .flat()
        .map(key => translationString(key))
        .join(' ');

    return (
        <IllustrationSvg
            viewBox={VIEW_BOX}
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={description}
            data-stage={stage}
            data-still={isReducedMotion || undefined}
            data-activity={isAnimated ? activity : undefined}
            data-scanning={isScanning || undefined}
            data-open={isFetchOpen || undefined}
            data-lit={isAnimated && lit !== undefined ? stage : undefined}
            data-result={isAnimated ? result : undefined}
            // The still's tray shows one dot as part of the diagram, not a count.
            style={{ '--kept': isAnimated ? keptCount : 1 }}
        >
            <g stroke="var(--ink)" strokeWidth="0.7">
                {ART.threads.map((path, weight) => (
                    <path key={path} d={path} strokeOpacity={0.085 + weight * 0.02} />
                ))}
                <path d={UNLIT_PATHS} strokeOpacity="0.15" />
                <path d={ART.relays} strokeOpacity="0.3" strokeWidth="2.4" />
                <path className="stream" d={ART.stream} strokeWidth="1.6" />
            </g>
            <g fill="var(--screen)" stroke="var(--ink)" strokeOpacity="0.72" strokeWidth="1.4">
                <rect x="254" y="38" width="132" height="88" rx="9" />
                <path d={ART.laptop} />
            </g>
            <g className="lit">
                {isReducedMotion && (
                    <LitCircuit
                        identity={0}
                        label={translationString('TR_COINJOIN_DISCOVERY_LABEL_TOR_CIRCUIT')}
                    />
                )}
                {isAnimated && lit !== undefined && (
                    <LitCircuit
                        key={lit.key}
                        identity={lit.identity}
                        label={translationString('TR_COINJOIN_DISCOVERY_LABEL_TOR_CIRCUIT_NUMBER', {
                            number: lit.identity + 1,
                        })}
                    />
                )}
            </g>
            <text x="320" y="160" fill="var(--label)">
                {translationString('TR_COINJOIN_DISCOVERY_LABEL_THIS_COMPUTER')}
            </text>
            <path d={ART.hairline} stroke="var(--ink)" strokeOpacity="0.09" />
            <g className="batch">
                <clipPath id={clipPathId}>
                    <rect className="unchecked" x="268" y="66" width="102" height="31" />
                </clipPath>
                <g clipPath={`url(#${clipPathId})`}>
                    <path d={BATCH_PATH} />
                    <g className="edge-step">
                        <path className="match" d={ART.match} stroke="var(--keep)" display="none" />
                    </g>
                    <rect className="edge" x="268.5" y="68" width="1" height="28" />
                </g>
                <g className="burns" stroke="var(--ember)">
                    {BATCH_COLUMNS.map(column => (
                        <g key={column} style={{ '--c': column } as CSSProperties}>
                            <path d={getBatchColumnPath(column)} />
                            <circle cx={274 + column * 8.5} cy={73 + (column % 3) * 8.5} r="0.9" />
                        </g>
                    ))}
                </g>
            </g>
            <g className="tray" fill="var(--keep)">
                {TRAY_SLOTS.map(slot => (
                    <circle
                        key={slot}
                        cx={274 + slot * 9}
                        cy="113"
                        r="2.2"
                        style={{ '--i': slot } as CSSProperties}
                    />
                ))}
            </g>
            <g className="block" stroke="var(--label)" strokeWidth="2.4" display="none">
                <rect x="308" y="47.5" width="24" height="15" rx="3" strokeWidth="1.1" />
                {BLOCK_COLUMNS.map(column => (
                    <path
                        key={column}
                        d={getBlockColumnPath(column)}
                        style={{ '--i': column } as CSSProperties}
                    />
                ))}
                <path className="mine" d={ART.mine} strokeWidth="3.2" />
            </g>
        </IllustrationSvg>
    );
};
