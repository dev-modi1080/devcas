import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private s3Client: S3Client | null = null;

  constructor(private db: ShiftService) {
    if (process.env.STORAGE_DRIVER === 'supabase') {
      const endpoint = process.env.SUPABASE_STORAGE_ENDPOINT;
      const region = process.env.SUPABASE_STORAGE_REGION || 'ap-northeast-1';
      const accessKeyId = process.env.SUPABASE_STORAGE_ACCESS_KEY_ID;
      const secretAccessKey = process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY;

      if (endpoint && accessKeyId && secretAccessKey) {
        this.s3Client = new S3Client({
          forcePathStyle: true,
          region,
          endpoint,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.logger.log('Supabase S3 Storage client initialized.');
      }
    }
  }

  async recordUpload(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file uploaded');

    let filePath = `/uploads/${file.filename}`;

    if (process.env.STORAGE_DRIVER === 'supabase' && this.s3Client) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'image';
      const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!fileBuffer) {
        throw new BadRequestException('Failed to read file buffer for storage upload');
      }

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: file.filename,
          Body: fileBuffer,
          ContentType: file.mimetype,
        }),
      );

      const baseUrl = process.env.SUPABASE_URL || 'https://bprrhtpeezmlunaonuve.supabase.co';
      filePath = `${baseUrl}/storage/v1/object/public/${bucket}/${file.filename}`;

      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore
        }
      }
    }

    const asset = await this.db.fileAsset.create({
      data: {
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        uploadedById: userId,
      },
    });

    return {
      id: asset.id,
      fileName: asset.originalName,
      fileUrl: asset.path,
      fileSize: asset.size,
      mimeType: asset.mimeType,
    };
  }
}
