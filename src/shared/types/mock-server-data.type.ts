import { LocationType } from './index.type.js';

export type MockServerDataType = {
  titles: string[];
  types: string[];
  cites: string[];
  locations: {
    [key: string]: LocationType;
  };
  previewImages: string[];
};
