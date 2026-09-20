import { Command } from './command.interface.js';
import { TSVFileReader } from '../../shared/libs/file-reader/index.js';
import { TSVParser } from '../../shared/libs/tsv-parser/index.js';
import { OfferModel } from '../../shared/modules/offer/offer.entity.js';
import { UserModel, DEFAULT_AVATAR_URL } from '../../shared/modules/user/user.entity.js';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../shared/libs/container/index.js';
import { LoggerInterface } from '../../shared/libs/logger/index.js';
import { DatabaseClientInterface } from '../../shared/libs/database/index.js';
import { OffersItemType } from '../../shared/types/index.type.js';
import { CityName, CreateOffer, OfferType } from '../../shared/modules/offer/index.js';
import { OFFER_GOODS, OfferGood } from '../../shared/modules/offer/offer.dto.js';
import { hashPassword } from './../../shared/helpers/password.helper.js';

function toOfferGoods(raw: string[]): OfferGood[] {
  const allowed = new Set<string>(OFFER_GOODS);
  return raw.filter((good): good is OfferGood => allowed.has(good));
}

@injectable()
export class ImportCommand implements Command {
  constructor(
    @inject(TYPES.Logger) private readonly logger: LoggerInterface,
    @inject(TYPES.DatabaseClient) private readonly databaseClient: DatabaseClientInterface,
  ) {}

  public getName(): string {
    return '--import';
  }

  public async execute(...parameters: string[]): Promise<void> {
    const filename = parameters[0]?.trim();
    if (!filename) {
      this.logger.error('ImportCommand: Filename is required. Usage: --import <path-to-file.tsv>');
      return;
    }

    try {
      await this.databaseClient.connect();

      const reader = new TSVFileReader(filename, new TSVParser(), this.logger);
      const data = await reader.read();

      if (!data || data.length === 0) {
        this.logger.warn('ImportCommand: No valid records found in the file.');
        return;
      }

      let upserted = 0;
      let errors = 0;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const recordNumber = i + 1;
        const offerTitle = typeof item.title === 'string' ? item.title : 'Untitled';

        try {
          await this.saveOffer(item);
          upserted++;
        } catch (err) {
          errors++;
          this.logger.error(
            err as Error,
            `ImportCommand: Line #${recordNumber} ("${offerTitle}") skipped.`,
          );
        }
      }

      this.logger.info(
        `ImportCommand: Upserted ${upserted} record(s). Errors: ${errors}.`,
      );

      if (errors === 0) {
        this.logger.info('ImportCommand: Import completed successfully without errors.');
      } else {
        this.logger.warn(`ImportCommand: Import finished with ${errors} error(s).`);
      }
    } catch (err) {
      this.logger.error(err as Error, 'ImportCommand: Critical error during import');
    } finally {
      await this.databaseClient.disconnect();
      this.logger.info('ImportCommand: Database connection closed.');
    }
  }

  private async saveOffer(item: OffersItemType): Promise<void> {
    const {
      title,
      type,
      price,
      previewImage,
      city: {
        name: cityName,
        location: {
          latitude: cityLatitude,
          longitude: cityLongitude,
          zoom: cityZoom,
        },
      },
      location: {
        latitude: offerLatitude,
        longitude: offerLongitude,
        zoom: offerZoom,
      },
      isPremium,
      description,
      bedrooms,
      goods: offerGoodsRaw,
      host: {
        name: userName,
        avatarUrl: userAvatarUrl,
        isPro: userIsPro,
      },
      images,
      maxAdults,
    } = item;

    const user = await this.findOrCreateUser(
      userName,
      userAvatarUrl,
      userIsPro,
    );

    const offerData: CreateOffer = {
      title,
      type: type as OfferType,
      price,
      previewImage,
      cityName: cityName as CityName,
      cityLatitude,
      cityLongitude,
      cityZoom,
      offerLatitude,
      offerLongitude,
      offerZoom,
      isPremium,
      description,
      bedrooms,
      offerGoods: toOfferGoods(offerGoodsRaw),
      user: user._id,
      images,
      maxAdults,
    };

    await OfferModel.create(offerData);
  }

  private async findOrCreateUser(
    name: string,
    avatarUrl: string,
    isPro: boolean,
  ) {
    const email = `${name.toLowerCase().replace(/\s+/g, ' ')}@example.com`;

    let user = await UserModel.findOne({ email }).exec();

    if (!user) {
      const hashedPassword = await hashPassword('default-password');

      user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        avatarUrl: avatarUrl || DEFAULT_AVATAR_URL,
        type: isPro ? 'pro' : 'regular',
      });
      this.logger.info(`ImportCommand: Created user ${email}`);
    }

    return user;
  }
}
