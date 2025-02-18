export interface WsAuthenticatedPayload  {
    _merchant: string
    _account: string
}

export interface MobileUploadDocumentsPayload extends WsAuthenticatedPayload {
    id:string
}
