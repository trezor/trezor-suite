import type { SessionStore } from '@ai/session-store';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Factory that returns a Fastify `onResponse` hook logging every request
 * as an audit event into Postgres.
 */
export function createAuditLogger(store: SessionStore) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        try {
            await store.audit({
                action: `${request.method} ${request.url}`,
                actor: (request as unknown as Record<string, string>).user ?? null,
                payload: {
                    statusCode: reply.statusCode,
                    ip: request.ip,
                    userAgent: request.headers['user-agent'] ?? 'unknown',
                },
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            request.log.error(err, 'Failed to write audit event');
        }
    };
}
