// Browser shim: use native DOMParser instead of @xmldom/xmldom
export class DOMParser extends globalThis.DOMParser {
  constructor(_options?: unknown) {
    super();
  }
}
