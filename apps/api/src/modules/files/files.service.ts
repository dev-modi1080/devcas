import { Injectable, BadRequestException } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';

@Injectable()
export class FilesService {
  constructor(private db: ShiftService) {}

  async recordUpload(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file uploaded');

    const asset = await this.db.fileAsset.create({
      data: {
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`,
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
