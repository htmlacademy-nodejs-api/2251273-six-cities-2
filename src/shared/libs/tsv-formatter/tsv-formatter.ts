import { OffersItemType } from '../../types/index.type.js';
import { FormatterInterface } from './tsv-formatter.interface.js';
import { TSV_FIELDS_OFFER } from '../../const.js';
import { getNestedValue } from '../../helpers/index.js';
import { logger } from '../../libs/logger/logger.index.js';

export class TSVFormatter implements FormatterInterface {
  public format(offer: OffersItemType): string {
    const fields = this.extractFields(offer);
    return fields.join('\t');
  }

  private extractFields(offer: OffersItemType): string[] {
    logger.info('Extracting fields...');
    return TSV_FIELDS_OFFER.map((field) => {
      const value = getNestedValue(offer, field);
      logger.debug('Extracted field: %s', value);
      return String(value ?? '');
    });
  }
}
