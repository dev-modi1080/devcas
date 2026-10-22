import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShiftModule } from './shift/shift.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MastersModule } from './modules/masters/masters.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { GreenZoneModule } from './modules/green-zone/green-zone.module';
import { MisModule } from './modules/mis/mis.module';
import { TreesModule } from './modules/trees/trees.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FilesModule } from './modules/files/files.module';
import { SettingsModule } from './modules/settings/settings.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ShiftModule,
    AuthModule,
    UsersModule,
    MastersModule,
    WorkflowModule,
    GreenZoneModule,
    MisModule,
    TreesModule,
    NotificationsModule,
    FilesModule,
    SettingsModule,
    JobsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
