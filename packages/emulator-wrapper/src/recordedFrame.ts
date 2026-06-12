export type Direction = 'out' | 'in';

export type MarkerType = 'device-disconnect' | 'device-reconnect';

export interface RecordedFrameEvent {
    kind: 'frame';
    ts: number;
    dir: Direction;
    messageType: number;
    name: string;
    hex: string;
}

export interface RecordedMarkerEvent {
    kind: 'marker';
    ts: number;
    type: MarkerType;
}

export type RecordedEvent = RecordedFrameEvent | RecordedMarkerEvent;

export interface RecordingFixtureMeta {
    model: string;
    fromVersion: string;
    toVersion: string;
    firmwareSha256: string;
    firmwareSize: number;
    recordedAt: string;
    protocol: 'v1';
}

export interface RecordingFixture {
    meta: RecordingFixtureMeta;
    events: RecordedEvent[];
}
