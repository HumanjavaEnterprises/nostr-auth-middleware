import { NostrEvent } from '../types.js';
import { verifySignature } from '../utils/crypto.utils.js';

export class NostrEventValidator {
  async validateEvent(event: NostrEvent): Promise<boolean> {
    if (!event || !event.id || !event.pubkey || !event.sig) {
      return false;
    }

    try {
      return await verifySignature(event);
    } catch (error) {
      return false;
    }
  }
}
