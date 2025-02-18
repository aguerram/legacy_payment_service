import { CacheModule, Global, Module } from '@nestjs/common';
import { CachingService } from './caching.service';
import * as mongoCaheStore from "cache-manager-mongodb"

@Global()
@Module({
    imports: [
        CacheModule.register({
            store: mongoCaheStore,
            uri: process.env.MONGO_URI,
            options: {
                collection: "cacheManager",
                compression: false,
                poolSize: 5,
                autoReconnect: true
            }
        })
    ],
    providers: [CachingService],
    exports: [CachingService]
})
export class CachingModule { }
