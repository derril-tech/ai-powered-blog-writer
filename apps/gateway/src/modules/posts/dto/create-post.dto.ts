import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ description: 'Post title', example: 'How to Build a Blog with AI' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Project ID', required: false })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: 'Site ID', required: false })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiProperty({ description: 'Target keyword', required: false })
  @IsOptional()
  @IsString()
  targetKeyword?: string;
}
