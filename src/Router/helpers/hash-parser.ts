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

const facetsWithMultiValue = {
  listing_type: true,
  property_type: true,
  school: true,
  sort: true
};

const facetsWithPlusValue = {
  beds: true,
  baths: true
};

const replacePlusWithSpace = (stringWithPlus: string): string => stringWithPlus.replace(/\+/g, ' ');
const removeFirstAndLastChars = (inputString: string): string => inputString.slice(1, -1);
const splitOnBar = (inputString: string): string[] => inputString.split('|');

/**
 * @description Applied to each segment in the hash string
 */
const parseFacetString = (name: string, facetString: string): any => {
  if (facetsWithMinMax[name]) {
    /* all min/max facets are in the form 'x|y' */
    const [min, max] = splitOnBar(facetString)
      .map(value => parseInt(value, 10))
      .sort((a, b) => a - b);

    return {
      min,
      max
    };
  }

  if (facetsWithMultiValue[name]) {
    const arrayOfMultiValues: string[] = compose(
      splitOnBar,
      removeFirstAndLastChars
    )(facetString);

    return arrayOfMultiValues.map(replacePlusWithSpace);
  }

  /* FALLBACK HANDLER */
  /* facets that already exist as a primitive */
  const maybeNumber = parseInt(facetString, 10);

  return isNaN(maybeNumber) ? replacePlusWithSpace(facetString) : maybeNumber;
};

/**
 * @description To parse the `window.location.hash` value into an object.
 * Used exclusively on the SRP page.
 */
const parseHashToObject = (hash: string): {} => {
  const segments = hash.split('&');

  const appliedFilters = segments.reduce((acc, curr, i) => {
    if (i === 0) {
      curr = curr.slice(3); // remove '#q='
    }

    /* Start splitting the query string into more manageable pieces */
    const facetComponents = splitOnBar(curr);

    /* [listing_type=1, [resale|new+home|foreclosure]] */
    const [facetType, facetValue] = [facetComponents.shift(), facetComponents.join('|')];

    /* [listing_type, 1] */
    const [facetName, facetRanking] = facetType.split('=');

    /* Facets have been split enough to get parsed into their respective structure now */
    const parsedFacet = parseFacetString(facetName, facetValue);

    return {
      ...acc,
      [facetName]: {
        ranking: parseInt(facetRanking, 10) === 1 ? 'must' : 'match', // TODO validate business logic
        value: parsedFacet || facetValue
      }
    };
  }, {});

  return appliedFilters;
};

/* ////////////////////////////////////// */

const sortAlphabetically = (a, b) => {
  const nameA = a.toLowerCase();
  const nameB = b.toLowerCase();

  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

/**
 * @description To build a hash from provided search filters
 * that can be used to generate a valid SRP url. Prefixed with
 * '#q='.
 */
const buildHashFromFilters = (filters: object): string => {
  const baseHash = '#q=';
  const alphabetizedKeys = Object.keys(filters).sort(sortAlphabetically);

  const hashPieces = alphabetizedKeys.map((filterKey: string) => {
    const ranking = filters[filterKey].ranking === 'must' ? 1 : 0;
    const filterValue = filters[filterKey].value;
    let value = filterValue;

    if (facetsWithMultiValue[filterKey] && Array.isArray(filterValue)) {
      value = `[${filterValue.join('|')}]`;
    }

    if (facetsWithMinMax[filterKey] && (filterValue.min || filterValue.max)) {
      value = facetsWithPlusValue[filterKey]
        ? `${filterValue.max}|${filterValue.min}`
        : `${filterValue.min}|${filterValue.max}`;
    }

    return `${filterKey}=${ranking}|${value}`;
  });

  const unencodedHash = `${baseHash}${hashPieces.join('&')}`;
  const encodedHash = unencodedHash.replace(/ /g, '+');

  return encodedHash;
};

export { parseHashToObject, buildHashFromFilters };
