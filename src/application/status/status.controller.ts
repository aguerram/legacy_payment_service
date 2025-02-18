
  import { Controller, Get } from '@nestjs/common';
  @Controller(`health`)
  export class StatusController {
  
    
    @Get()
    async status() {
      return;
    }
  
  }
  