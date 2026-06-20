import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports liveness without exposing internals', () => {
    const controller = new HealthController({} as never);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('reports readiness when the database responds', async () => {
    const controller = new HealthController({
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as never);
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      database: 'available',
    });
  });

  it('returns a safe failure when the database is unavailable', async () => {
    const controller = new HealthController({
      $queryRaw: jest.fn().mockRejectedValue(new Error('secret connection')),
    } as never);
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
