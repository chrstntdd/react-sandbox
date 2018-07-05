import { compose } from '@/utils/fp';

const facetsWithMinMax = {
  beds: true,
  baths: true,
  price: true,
  square_footage: true,
  num_stories: true,
  lot_size: true,
  year_built: true
};

const facetsWithMutliValue = {
  listing_type: true,
  property_type: true,
  school: true,
  sort: true
};

const replacePlusWithSpace = (stringWithPlus: string): string => stringWithPlus.replace('+', ' ');
const removeFirstAndLastChars = (inputString: string): string => inputString.slice(1, -1);
const splitOnBar = (inputString: string): string[] => inputString.split('|');

/**
 * @description Applied to each segment in the hash string
 */
const parseFacetString = (name: string, facetString: string): any => {
  if (facetsWithMinMax[name]) {
    /* all min/max facets are in the form 'x|y' */
    const [min, max] = splitOnBar(facetString)
      .map(value => parseInt(value, 0))
      .sort((a, b) => a - b);

    return {
      min,
      max
    };
  }

  if (facetsWithMutliValue[name]) {
    const arrayOfMultiValues: string[] = compose(
      splitOnBar,
      removeFirstAndLastChars
    )(facetString);

    return arrayOfMultiValues.map(replacePlusWithSpace);
  }

  /* FALLBACK HANDLER */
  /* facets that already exist as a primitive */
  const maybeNumber = parseInt(facetString, 0);

  return isNaN(maybeNumber) ? replacePlusWithSpace(facetString) : maybeNumber;
};

/**
 * @description To parse the `window.location.hash` value into an object.
 * Used exclusively on the SRP page.
 */
const hashParser = (hash: string): {} => {
  const segments = hash.split('&');

  const appliedFilters = segments.reduce((acc, curr, i) => {
    if (i === 0) {
      curr = curr.slice(3); // remove '#q='
    }

    /* Start splitting the query string into more manageable pieces */
    const facetComponents = splitOnBar(curr);

    /* [city=1, Virginia+Beach] */
    const [facetType, facetValue] = [facetComponents.shift(), facetComponents.join('|')];

    /* [city, 1] */
    const [facetName, facetRanking] = facetType.split('=');

    /* Facets have been split enough to get parsed into their respective structure now */
    const parsedFacet = parseFacetString(facetName, facetValue);

    return {
      ...acc,
      [facetName]: {
        ranking: parseInt(facetRanking, 0) === 1 ? 'must' : 'match', // TODO validate business logic
        value: parsedFacet || facetValue
      }
    };
  }, {});

  return appliedFilters;
};

export { hashParser };
