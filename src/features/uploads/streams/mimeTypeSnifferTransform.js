import { Transform } from 'stream';
import { fileTypeFromBuffer } from 'file-type';

const SNIFF_BYTES = 4100;


export class MimeTypeSnifferTransform extends Transform {
    constructor(){
        super();
        this._headerChunks = [];
        this._headerBytes = 0;
        this._sniffed = false;
        this.detectedMimeType = 'application/octet-stream'; 
    }

    async _transform (chunk,encoding,callback){
        try{
            if(this._sniffed){

                this.push(chunk);
                return callback();
            }

            this._headerChunks.push(chunk)
            this._headerBytes += chunk.length
        if (this._headerBytes >= SNIFF_BYTES) {
            // We have enough bytes — detect and flush
            await this._detect();
            for (const buffered of this._headerChunks) {
            this.push(buffered);
            }
            this._headerChunks = [];
        }
        callback()
        }catch (err) {
        callback(err);
    }
    }
    async _flush(callback) {
        try {
        if (!this._sniffed) {
            await this._detect();
            for (const buffered of this._headerChunks) {
            this.push(buffered);
            }
            this._headerChunks = [];
        }
        callback();
        } catch (err) {
        callback(err);
        }
    }


    async _detect(){
        const headerBuffer = Buffer.concat(this._headerChunks);
        const result = await fileTypeFromBuffer(headerBuffer);
        this.detectedMimeType = result?.mime ?? 'application/octet-stream';
        this._sniffed = true;
    }
}