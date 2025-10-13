import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@Req() req: any, @Query('status') status?: 'PENDING' | 'DONE') {
    return this.tasks.list(req.user.userId, { status });
  }

  @Post()
  create(@Req() req: any, @Body() body: { title: string; description?: string; dueDate?: string }) {
    const dueDate = body.dueDate ? new Date(body.dueDate) : undefined
    return this.tasks.create(req.user.userId, { title: body.title, description: body.description, dueDate });
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.tasks.update(req.user.userId, id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tasks.remove(req.user.userId, id);
  }
}


