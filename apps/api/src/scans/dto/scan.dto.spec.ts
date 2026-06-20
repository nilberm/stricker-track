import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ScanSource } from '@sticker-track/database';
import {
  ConfirmScanDto,
  ResolveScanDto,
  ValidateScanCandidatesDto,
} from './scan.dto';

describe('ConfirmScanDto', () => {
  const validInput = {
    scanId: '11111111-1111-4111-8111-111111111111',
    stickerId: '22222222-2222-4222-8222-222222222222',
  };

  it.each([-1, 0, 1.5])('rejects invalid quantity %s', async (quantity) => {
    const input = plainToInstance(ConfirmScanDto, {
      ...validInput,
      quantityToAdd: quantity,
    });
    expect(await validate(input)).not.toHaveLength(0);
  });

  it('defaults to one', async () => {
    const input = plainToInstance(ConfirmScanDto, validInput);
    expect(await validate(input)).toHaveLength(0);
    expect(input.quantityToAdd).toBe(1);
  });
});

describe('ValidateScanCandidatesDto', () => {
  it('rejects excessive candidate payloads', async () => {
    const input = plainToInstance(ValidateScanCandidatesDto, {
      candidates: Array.from({ length: 11 }, () => ({ value: 'NTH1' })),
    });
    expect(await validate(input)).not.toHaveLength(0);
  });
});

describe('ResolveScanDto', () => {
  it('accepts bounded camera metadata', async () => {
    const input = plainToInstance(ResolveScanDto, {
      rawText: 'NTH O1',
      source: ScanSource.CAMERA,
      ocrConfidence: 0.88,
      candidates: [{ value: 'NTH1', confidence: 0.92, corrections: ['O->0'] }],
      selectedCandidate: 'NTH1',
    });
    expect(await validate(input)).toHaveLength(0);
  });

  it('rejects oversized OCR payloads', async () => {
    const input = plainToInstance(ResolveScanDto, {
      rawText: 'x'.repeat(2001),
      candidates: Array.from({ length: 11 }, () => ({ value: 'NTH1' })),
    });
    expect(await validate(input)).not.toHaveLength(0);
  });
});
