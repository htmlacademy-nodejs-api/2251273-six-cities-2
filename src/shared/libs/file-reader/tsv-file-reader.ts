import { FileReader } from './file-reader.interface.js';
import { readFileSync } from 'node:fs';
import { OffersItemType } from '../../types/index.type.js';

export class TSVFileReader implements FileReader {
  private rawData = '';

  constructor(
    private readonly filename: string
  ) { }

  public read(): void {
    this.rawData = readFileSync(this.filename, { encoding: 'utf-8' });
  }

  public toArray(): OffersItemType[] {
    if (!this.rawData) {
      throw new Error('File was not read');
    }

    return this.rawData
      .split('\n')
      .filter((row) => row.trim().length > 0)
      .map((line) => line.split('\t'))
      .map(([id,
        title,
        type,
        price,
        previewImage,
        cityName,
        cityLocationLatitude,
        cityLocationLongitude,
        cityLocationZoom,
        offerLocationLatitude,
        offerLocationLongitude,
        offerLocationZoom,
        isFavorite,
        isPremium,
        rating,]) => ({
        id,
        title,
        type,
        price: Number(price),
        city: {
          name: cityName,
          location: {
            latitude: Number(cityLocationLatitude),
            longitude: Number(cityLocationLongitude),
            zoom: Number(cityLocationZoom),
          }
        },
        location: {
          latitude: Number(offerLocationLatitude),
          longitude: Number(offerLocationLongitude),
          zoom: Number(offerLocationZoom),
        },
        isFavorite: isFavorite === 'true',
        isPremium: isPremium === 'true',
        rating: Number(rating),
        previewImage,
      }));
  }
}
