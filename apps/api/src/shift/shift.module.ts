import { Global, Module } from '@nestjs/common';
import { ShiftService } from './shift.service';

/**
 * Global module exposing the local SQLite storage layer to the whole API.
 */
@Global()
@Module({
  providers: [ShiftService],
  exports: [ShiftService],
})
export class ShiftModule {}
