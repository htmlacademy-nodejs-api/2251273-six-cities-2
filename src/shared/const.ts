const OFFER_PRICE = {
  min: 0,
  max: 1000,
};

const OFFER_RATING = {
  min: 1,
  max: 5,
};

const TSV_FIELDS_OFFER = [
  'id',
  'title',
  'type',
  'price',
  'previewImage',
  'city.name',
  'city.location.latitude',
  'city.location.longitude',
  'city.location.zoom',
  'location.latitude',
  'location.longitude',
  'location.zoom',
  'isFavorite',
  'isPremium',
  'rating',
];

export {
  OFFER_PRICE,
  OFFER_RATING,
  TSV_FIELDS_OFFER,
};
