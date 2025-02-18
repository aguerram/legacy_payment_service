export class SocketSendData {
    translationCode: number;
    data: any;
    constructor(
        {
            translationCode = 0,
            data = {}
        }
    ) {
        this.translationCode = translationCode;
        this.data = data
    }
}