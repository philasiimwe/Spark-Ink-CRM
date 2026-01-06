```typescript
// Client-Side Rate Limiter for API Calls

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    queueEnabled?: boolean;
}

import React from 'react';

interface QueuedRequest {
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
}

class RateLimiter {
    private requests: number[] = [];
    private queue: QueuedRequest[] = [];
    private processing = false;

    constructor(private config: RateLimitConfig) { }

    // Check if we're within rate limit
    private canMakeRequest(): boolean {
        const now = Date.now();

        // Remove requests outside the time window
        this.requests = this.requests.filter(
            timestamp => now - timestamp < this.config.windowMs
        );

        return this.requests.length < this.config.maxRequests;
    }

    // Add request timestamp
    private addRequest(): void {
        this.requests.push(Date.now());
    }

    // Process queued requests
    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            if (!this.canMakeRequest()) {
                // Wait for the oldest request to expire
                const oldestRequest = this.requests[0];
                const waitTime = this.config.windowMs - (Date.now() - oldestRequest);

                if (waitTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, waitTime + 10));
                }
            }

            const request = this.queue.shift();
            if (request) {
                try {
                    this.addRequest();
                    const result = await request.fn();
                    request.resolve(result);
                } catch (error) {
                    request.reject(error);
                }
            }
        }

        this.processing = false;
    }

    // Execute a function with rate limiting
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        // If we can make the request immediately, do it
        if (this.canMakeRequest()) {
            this.addRequest();
            return fn();
        }

        // If queueing is disabled, throw an error
        if (!this.config.queueEnabled) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Queue the request
        return new Promise<T>((resolve, reject) => {
            this.queue.push({
                fn,
                resolve,
                reject,
                timestamp: Date.now()
            });

            // Start processing the queue
            this.processQueue();
        });
    }

    // Get current rate limit status
    getStatus() {
        const now = Date.now();
        this.requests = this.requests.filter(
            timestamp => now - timestamp < this.config.windowMs
        );

        return {
            requestsInWindow: this.requests.length,
            maxRequests: this.config.maxRequests,
            queueLength: this.queue.length,
            canMakeRequest: this.canMakeRequest()
        };
    }

    // Clear all requests and queue
    reset(): void {
        this.requests = [];
        this.queue = [];
    }
}

// Pre-configured rate limiters for different API types
export const rateLimiters = {
    // Standard API calls - 60 requests per minute
    api: new RateLimiter({
        maxRequests: 60,
        windowMs: 60 * 1000,
        queueEnabled: true
    }),

    // Search/query operations - 30 requests per minute
    search: new RateLimiter({
        maxRequests: 30,
        windowMs: 60 * 1000,
        queueEnabled: true
    }),

    // File uploads - 10 per minute
    upload: new RateLimiter({
        maxRequests: 10,
        windowMs: 60 * 1000,
        queueEnabled: true
    }),

    // AI operations - 20 per minute
    ai: new RateLimiter({
        maxRequests: 20,
        windowMs: 60 * 1000,
        queueEnabled: true
    }),

    // Email sending - 50 per hour
    email: new RateLimiter({
        maxRequests: 50,
        windowMs: 60 * 60 * 1000,
        queueEnabled: true
    })
};

// Wrapper function for rate-limited API calls
export async function withRateLimit<T>(
    type: keyof typeof rateLimiters,
    fn: () => Promise<T>
): Promise<T> {
    const limiter = rateLimiters[type];
    return limiter.execute(fn);
}

// Decorator for rate-limited methods
export function RateLimited(type: keyof typeof rateLimiters) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return withRateLimit(type, () => originalMethod.apply(this, args));
        };

        return descriptor;
    };
}

// React hook for rate limit status
export function useRateLimitStatus(type: keyof typeof rateLimiters) {
    const [status, setStatus] = React.useState(rateLimiters[type].getStatus());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setStatus(rateLimiters[type].getStatus());
        }, 1000);

        return () => clearInterval(interval);
    }, [type]);

    return status;
}

export default {
    RateLimiter,
    rateLimiters,
    withRateLimit,
    RateLimited,
    useRateLimitStatus
};
