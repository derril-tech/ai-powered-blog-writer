import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Request() req: any,
  ) {
    return this.postsService.create(createPostDto, req.user.orgId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts for the organization' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'outline', 'writing', 'review', 'published', 'archived'] })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPosts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    return this.postsService.findAll(req.user.orgId, { page, limit, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.findOne(id, req.user.orgId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: any,
  ) {
    return this.postsService.update(id, updatePostDto, req.user.orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deletePost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.remove(id, req.user.orgId);
  }

  @Post(':id/outline')
  @ApiOperation({ summary: 'Generate outline for a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Outline generated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateOutline(@Param('id') id: string, @Request() req: any) {
    return this.postsService.generateOutline(id, req.user.orgId);
  }

  @Post(':id/draft')
  @ApiOperation({ summary: 'Generate draft for a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Draft generated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateDraft(@Param('id') id: string, @Request() req: any) {
    return this.postsService.generateDraft(id, req.user.orgId);
  }

  @Post(':id/qa')
  @ApiOperation({ summary: 'Run QA checks on a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'QA checks completed successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async runQaChecks(@Param('id') id: string, @Request() req: any) {
    return this.postsService.runQaChecks(id, req.user.orgId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post published successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async publishPost(@Param('id') id: string, @Request() req: any) {
    return this.postsService.publish(id, req.user.orgId);
  }
}
