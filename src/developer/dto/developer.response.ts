export class DeveloperResponse {
    constructor(
        public data: any,
        public success: boolean = true,
        public message: string | null = null
    ) { }
}