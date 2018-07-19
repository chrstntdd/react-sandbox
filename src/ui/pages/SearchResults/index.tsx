import React, { Component } from 'react';

import { compose } from '@/utils/fp';

const flipArray = array => [...array].reverse();
const head = array => [...array][0];

const getLastElFromArray = compose(
  head,
  flipArray
);

const mergeSrpPathWithHash = (srpPath, hash) => {
  const hashClone = Object.assign(hash, {});
  const vanityFacets = srpPath.split('/');
  const page = getLastElFromArray(vanityFacets);
  /* [2 letter region abbreviation, [*other location data*] ] */
  const [maybeRegion, ...locationRest] = flipArray(head(vanityFacets).split('-'));

  hashClone.page = page;

  if (maybeRegion /* && check that the region exists in the map */) {
    if (hashClone.region !== maybeRegion) hashClone.region = maybeRegion;
  }

  const maybeCityOrCounty = flipArray(locationRest);
  if (maybeCityOrCounty) {
    if (getLastElFromArray(maybeCityOrCounty) === 'county') {
      hashClone.county = maybeCityOrCounty.filter(piece => piece !== 'county').join(' ');
    }
  }

  // console.log(vanityFacets, page, maybeRegion);
};

class SearchResults extends Component {
  state = {
    srpPath: this.props['*']
  };

  componentDidMount() {
    // mergeSrpPathWithHash(this.state.srpPath, this.props.hash);
  }

  render() {
    return <div className="search-results">SearchResults</div>;
  }
}

export default SearchResults;
