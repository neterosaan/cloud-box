import { Transform } from 'stream';

export class MimeTypeValidatorTransform extends Transform {
  constructor({ mimeSniffer, allowedTypes }) {
    super();
    this.mimeSniffer = mimeSniffer;
    this.allowedTypes = allowedTypes;
    this._validated = false;
  }
    _transform(chunk, encoding, callback) {
        
      if (!this._validated) {
      this._validated = true;

      const mimeType = this.mimeSniffer.detectedMimeType;

      if (!this.allowedTypes.has(mimeType)) {
        const err = new Error(
          `File type "${mimeType}" is not allowed. Please upload a supported file type.`
        );
        err.status = 422;
        return callback(err); // kills the pipeline immediately
      }
    }

    this.push(chunk);
    callback();
  }
}