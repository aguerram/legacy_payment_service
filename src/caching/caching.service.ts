import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from "cache-manager"
@Injectable()
export class CachingService {
    constructor(
        @Inject(CACHE_MANAGER) public cache: Cache
    ) { }

}
