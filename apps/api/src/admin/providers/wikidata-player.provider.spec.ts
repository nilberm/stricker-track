import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { WikidataPlayerProvider } from './wikidata-player.provider';

type RequestJson = {
  requestJson<T>(url: string): Promise<T>;
};

describe('WikidataPlayerProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('retries once and reports a provider rate limit', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }) as jest.MockedFunction<typeof fetch>;
    const provider = new WikidataPlayerProvider() as unknown as RequestJson;

    const request = provider.requestJson('https://www.wikidata.org/test');
    const expectation = expect(request).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await jest.advanceTimersByTimeAsync(750);

    await expectation;
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('aborts a provider request after the timeout', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });
    const provider = new WikidataPlayerProvider() as unknown as RequestJson;

    const request = provider.requestJson('https://www.wikidata.org/test');
    const expectation = expect(request).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
    await jest.advanceTimersByTimeAsync(8_000);

    await expectation;
  });
});
