import { GraphPoint } from 'react-native-graph';

export const generateRandomGraphData = (length: number): GraphPoint[] =>
    Array<number>(length)
        .fill(0)
        .map((_, index) => ({
            date: new Date(index),
            value: Math.floor(Math.random() * 100) + 1,
        }));
