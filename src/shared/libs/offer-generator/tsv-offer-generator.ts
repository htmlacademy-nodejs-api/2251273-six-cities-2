import { OfferGenerator } from './offer-generator.interface.js';
import { MockServerDataType, OffersItemType } from './../../types/index.type.js';
import { v4 } from 'uuid';
import { generateRandomValue, getRandomItem } from './../../helpers/index.js';
import { OFFER_PRICE, OFFER_RATING } from './../../const.js';
import { TSVFormatter } from '../tsv-formatter/tsv-formatter.js';

export class TSVOfferGenerator implements OfferGenerator {
  constructor(private readonly mockData: MockServerDataType) { }

  // Генерируем оффер
  generate(): string {
    const { titles, types, cites, locations, previewImages } = this.mockData;

    const id = v4();
    const title = getRandomItem(titles);
    const type = getRandomItem(types);
    const cityName = getRandomItem(cites);

    const cityLocation = locations[cityName] ?? { latitude: 0, longitude: 0, zoom: 0 };
    const previewImage = getRandomItem(previewImages);

    const offerLocation = locations[cityName] ?? { latitude: 0, longitude: 0, zoom: 0 };

    const price = generateRandomValue(OFFER_PRICE.min, OFFER_PRICE.max);
    const rating = Number(generateRandomValue(OFFER_RATING.min, OFFER_RATING.max, 1).toFixed(1));
    const isFavorite = getRandomItem([true, false]);
    const isPremium = (getRandomItem([true, false]));

    const offer: OffersItemType = {
      id,
      title,
      type,
      price,
      previewImage,
      city: {
        name: cityName,
        location: {
          latitude: cityLocation.latitude,
          longitude: cityLocation.longitude,
          zoom: cityLocation.zoom,
        },
      },
      location: {
        latitude: offerLocation.latitude,
        longitude: offerLocation.longitude,
        zoom: offerLocation.zoom,
      },
      isFavorite,
      isPremium,
      rating,
    };
    const offerFormatter = new TSVFormatter().format(offer);
    return offerFormatter;
  }
}
