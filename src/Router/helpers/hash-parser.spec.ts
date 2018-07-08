import { parseHashToObject, buildHashFromFilters } from './hash-parser';

const testHash =
  '#q=baths=0|3|0&beds=0|3|0&city=1|virginia+beach&listing_status=1|for+sale&listing_type=1|[resale|new+home|foreclosure]&lot_size=0|4|6999&neighborhood=1|Thalia+Manor&num_stories=0|3|3&price=1|272000|368000&property_type=1|[house|lots+land|condominium|multi+family|mobile+manufactured|townhouse|farm|apartment]&region=1|va&school=0|[Thalia+Elementary+School]&sort=1|[score|desc]&square_footage=0|2|2000&walk_in_closet=0|1&year_built=0|1|2020';

test('Should be able to convert between a string hash to a filters object and back again', () => {
  const filtersObj = parseHashToObject(testHash);
  const derivedHash = buildHashFromFilters(filtersObj);

  expect(derivedHash).toEqual(testHash);
  expect(parseHashToObject(derivedHash)).toEqual(filtersObj);
});
