import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from "@nestjs/event-emitter"
import { CachingService } from 'src/caching/caching.service';
import { socketRoomHelpers } from 'src/shared/helpers';
import { ApplicationGateway } from '../gatway/application.gateway';
import { SocketEvents } from '../gatway/socket_events';
import { SocketSendData } from '../gatway/socket_send_data';
import { EventsTypes } from './events.enum';
import { MobileDocumentsUploadedEvent } from './events.interface';

@Injectable()
export class EventsListenerService {
    private logger: Logger = new Logger(EventsListenerService.name)
    constructor(
        private readonly applicationGateway: ApplicationGateway,
        private readonly cacheService: CachingService
    ) { }

    @OnEvent(EventsTypes.MOBILE_DOCUMENTS_UPLOADED)
    async mobileDocumentsUploadedHandler(payload: MobileDocumentsUploadedEvent) {
        const merchant = payload.merchant

        if (
            merchant.onboarding.qidDoc?.length > 0
            &&
            merchant.onboarding.orgCommercialRegistrationDoc.key
        ) {
            this.logger.log(`Documents are uploaded for the merchant ${merchant._id}`)

            this.logger.log(`Deleting temporary token`)
            await this.cacheService.cache.del(String(merchant._id))

            this.applicationGateway.brodcast(
                socketRoomHelpers.merchantRoomPrefix(payload.merchant._id),
                SocketEvents.MOBILE_DOCUMENTS_UPLOADED,
                new SocketSendData({
                    translationCode: 1032,
                    data: payload.fromMobile
                })
            )
        }
    }
}
