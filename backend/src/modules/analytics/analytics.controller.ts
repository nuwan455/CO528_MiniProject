import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analyticsService.overview();
  }

  @Get('posts')
  posts() {
    return this.analyticsService.posts();
  }

  @Get('jobs')
  jobs() {
    return this.analyticsService.jobs();
  }

  @Get('events')
  events() {
    return this.analyticsService.events();
  }
}
