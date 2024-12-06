import { NostrEvent } from '../utils/types';
import { verifySignature } from '../utils/crypto.utils';

export class NostrEventValidator {
  async validateEvent(event: NostrEvent): Promise<boolean> {
    if (!event || !event.id || !event.pubkey || !event.sig) {
      return false;
    }

    try {
      return await verifySignature(event.sig, event.id, event.pubkey);
    } catch (error) {
      return false;
    }
  }
}
