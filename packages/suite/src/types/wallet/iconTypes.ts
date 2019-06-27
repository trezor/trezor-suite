interface IconShape {
    paths: string[];
    viewBox: string;
    ratio?: number;
}

export interface Icon {
    size: number;
    color: string;
    type: string | IconShape;
}
