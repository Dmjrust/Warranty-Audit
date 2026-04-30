import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private readonly bucket = process.env.R2_BUCKET_NAME ?? 'warranty-evidence';
  private readonly publicUrl = process.env.R2_PUBLIC_URL ?? '';

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log('Storage: Cloudflare R2 configurado');
    } else {
      this.logger.warn('Storage: credenciais R2 ausentes — modo local (URLs simuladas)');
    }
  }

  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = originalName.split('.').pop() ?? 'bin';
    const key = `evidence/${randomUUID()}.${ext}`;

    if (!this.s3) {
      // Local dev fallback: return a placeholder URL
      this.logger.debug(`[LOCAL] Simulating upload: ${key}`);
      return `local://${key}`;
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return `${this.publicUrl}/${key}`;
  }
}
