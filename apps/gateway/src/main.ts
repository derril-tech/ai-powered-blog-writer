import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AI Blog Writer API')
    .setDescription('API for AI-powered blog content generation and publishing')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('orgs', 'Organization management')
    .addTag('sites', 'Site and connector management')
    .addTag('projects', 'Project management')
    .addTag('keywords', 'Keyword research and discovery')
    .addTag('posts', 'Post content management')
    .addTag('outlines', 'Content outline generation')
    .addTag('drafts', 'Content draft generation')
    .addTag('qa', 'Quality assurance checks')
    .addTag('publish', 'Content publishing')
    .addTag('analytics', 'Analytics and metrics')
    .addTag('comments', 'Collaboration and comments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API documentation available at: http://localhost:${port}/api`);
}

bootstrap();
