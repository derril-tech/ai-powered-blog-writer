import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { SitesModule } from './modules/sites/sites.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { KeywordsModule } from './modules/keywords/keywords.module';
import { PostsModule } from './modules/posts/posts.module';
import { OutlinesModule } from './modules/outlines/outlines.module';
import { DraftsModule } from './modules/drafts/drafts.module';
import { QaModule } from './modules/qa/qa.module';
import { PublishModule } from './modules/publish/publish.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    OrgsModule,
    SitesModule,
    ProjectsModule,
    KeywordsModule,
    PostsModule,
    OutlinesModule,
    DraftsModule,
    QaModule,
    PublishModule,
    AnalyticsModule,
    CommentsModule,
  ],
})
export class AppModule {}
