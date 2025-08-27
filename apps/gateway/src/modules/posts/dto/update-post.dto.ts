import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({ description: 'Post title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ 
    description: 'Post status', 
    enum: ['draft', 'outline', 'writing', 'review', 'published', 'archived'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['draft', 'outline', 'writing', 'review', 'published', 'archived'])
  status?: string;

  @ApiProperty({ description: 'Target keyword', required: false })
  @IsOptional()
  @IsString()
  targetKeyword?: string;
}
