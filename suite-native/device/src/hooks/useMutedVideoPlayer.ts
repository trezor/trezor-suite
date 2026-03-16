import { type VideoPlayer, type VideoSource, useVideoPlayer } from 'expo-video';

export function useMutedVideoPlayer(
    source: VideoSource,
    setup?: (player: VideoPlayer) => void,
): VideoPlayer {
    return useVideoPlayer(source, player => {
        setup?.(player);
        player.audioMixingMode = 'auto';
        player.muted = true;
    });
}
