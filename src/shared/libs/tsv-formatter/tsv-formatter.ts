import { OffersItemType } from '../../types/index.type.js';
import { FormatterInterface } from './tsv-formatter.interface.js';

export class TSVFormatter implements FormatterInterface {
  public format(offer: OffersItemType): string {
    const fields = this.extractFields(offer);
    return fields.join('\t');
  }

  private extractFields(offer: OffersItemType): string[] {
    return [
      offer.id,
      offer.title,
      offer.type,
      String(offer.price),
      offer.previewImage,
      offer.city.name,
      String(offer.city.location.latitude),
      String(offer.city.location.longitude),
      String(offer.city.location.zoom),
      String(offer.location.latitude),
      String(offer.location.longitude),
      String(offer.location.zoom),
      String(offer.isFavorite),
      String(offer.isPremium),
      String(offer.rating),
    ];
  }
}
