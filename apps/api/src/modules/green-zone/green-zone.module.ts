import { Module } from '@nestjs/common';
import { GreenZoneService } from './green-zone.service';
import { GreenZoneController } from './green-zone.controller';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [WorkflowModule],
  controllers: [GreenZoneController],
  providers: [GreenZoneService],
  exports: [GreenZoneService],
})
export class GreenZoneModule {}
