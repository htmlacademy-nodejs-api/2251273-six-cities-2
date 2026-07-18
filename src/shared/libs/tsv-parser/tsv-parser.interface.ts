import { OffersItemType } from '../../types/index.type.js';

export interface ParserInterface {
  parse(line: string): OffersItemType;
}
