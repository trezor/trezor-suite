import type { FastifyReply, FastifyRequest } from 'fastify';
import { type JWTPayload, jwtVerify } from 'jose';

export interface GatewayJwtPayload extends JWTPayload {
    sub?: string;
    engineerId?: string;
}

declare module 'fastify' {
    interface FastifyRequest {
        user?: GatewayJwtPayload;
    }
}

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array | null {
    if (cachedSecret) return cachedSecret;

    const raw = process.env.JWT_SECRET;
    if (!raw || raw === 'changeme-jwt-secret') return null;

    cachedSecret = new TextEncoder().encode(raw);

    return cachedSecret;
}

/**
 * JWT auth middleware using `jose` for verification.
 *
 * When JWT_SECRET is unset or still the placeholder value, all tokens are
 * accepted (dev mode). In production, tokens are verified against the secret.
 */
export async function jwtAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or malformed Authorization header' });

        return;
    }

    const token = header.slice(7);
    const secret = getSecret();

    if (!secret) {
        request.log.warn('JWT verification skipped – JWT_SECRET is not configured');

        return;
    }

    try {
        const { payload } = await jwtVerify(token, secret);
        request.user = payload as GatewayJwtPayload;
    } catch (err) {
        request.log.warn({ err }, 'JWT verification failed');
        reply.code(401).send({ error: 'Invalid or expired token' });
    }
}
