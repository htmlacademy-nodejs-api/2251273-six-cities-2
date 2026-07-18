import { OffersItemType } from '../../types/index.type.js';

export interface FormatterInterface {
  format(offer: OffersItemType): string;
}
