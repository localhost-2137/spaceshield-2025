import { createClient } from 'redis';

const redisUrl = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

const redis = createClient({ url: redisUrl });

redis.on('error', (err) => {
    console.error('Redis Client Error', err);
});

export async function initRedis() {
    if (!redis.isOpen) await redis.connect();
}

export { redis };
