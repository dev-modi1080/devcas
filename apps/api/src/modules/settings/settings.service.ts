import { Injectable } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';

@Injectable()
export class SettingsService {
  constructor(private db: ShiftService) {}

  async getAllSettings() {
    const defaultSettings = [
      { key: 'APPROVAL_REMINDER_DAYS', value: '3', description: 'Days before approval reminder is sent' },
      { key: 'MIS_ENTRY_WINDOW_DAYS', value: '10', description: 'End day of monthly entry window (1 to N)' },
      { key: 'MAX_FILE_SIZE_MB', value: '5', description: 'Maximum file upload size in MB' },
      { key: 'BLOCK_LATE_MIS_ENTRY', value: 'false', description: 'Block late MIS submissions outside window' },
    ];

    const dbSettings = await this.db.systemSetting.findMany();
    const result: Record<string, string> = {};

    defaultSettings.forEach((s) => {
      const match = dbSettings.find((item) => item.key === s.key);
      result[s.key] = match ? match.value : s.value;
    });

    return result;
  }

  async updateSetting(key: string, value: string, description?: string) {
    return this.db.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }
}
