import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // Lightweight liveness probe for deployment platforms.
  @Get('health')
  health(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
