import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class UnnamedGuard implements CanActivate {
  private logger: Logger = new Logger(UnnamedGuard.name);
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const notificationId = request.headers['X-Notification-Secret'] || request.headers['x-notification-secret'];
    console.log(notificationId)
    this.logger.log(`Trying to Access MC webhook at url ${request.path}`);
    if (!notificationId || notificationId!== String(process.env.MC_NOTIFICATION_ID) && notificationId!== String(process.env.MC_NOTIFICATION_ID_TEST)) {
      this.logger.log(`Access denied due to missing/invalid notification ID`);
      return false;
    } else {
      this.logger.log(`Access granted to process payment with MC webhook`);
      request.testMode = notificationId!==String(process.env.MC_NOTIFICATION_ID);
      return true;
    }
  }
}
