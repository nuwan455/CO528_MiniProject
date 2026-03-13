import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello(): { success: boolean; message: string; timestamp: string } {
        return {
            success: true,
            message: 'Welcome to the DECP Backend API! The server is running and accessible.',
            timestamp: new Date().toISOString(),
        };
    }
}
