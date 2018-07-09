import React, { Component } from 'react';

import { Router, Link } from '@/Router';
import Page from '@/ui/components/Page';

import generateLazyComponent from '@/ui/components/LazyComponent';

import s from '@/ui/App.css';

const About = generateLazyComponent(() => import('@/ui/pages/About'));
const Home = generateLazyComponent(() => import('@/ui/pages/Home'));
const Contact = generateLazyComponent(() => import('@/ui/pages/Contact'));
const Dashboard = generateLazyComponent(() => import('@/ui/pages/Dashboard'));
const SearchResults = generateLazyComponent(() => import('@/ui/pages/SearchResults'));

/**
 * @description CURRENT CODE SPLITTING IMPLEMENTATION SPLITS
 * AT THE TOP LEVEL, BUT IT CAN BE DONE LOWER DOWN IN THE TREE
 * AS WELL OR ON AN INDIVIDUAL COMPONENT LEVEL.
 */
class App extends Component {
  render() {
    const mockSrpRoute =
      '/virginia-beach-va/homes-for-sale/#q=beds=0|1|0&city=1|virginia+beach&listing_status=1|for+sale&listing_type=1|[resale|new+home|foreclosure]&price=1|272000|368000&property_type=1|[house|lots+land|condominium|multi+family|mobile+manufactured|townhouse|farm|apartment]&region=1|va&sort=1|[score|desc]';
    return (
      <Page>
        <nav className={`${s.navContainer} flex justify-center`}>
          <Link to="/">Home</Link>
          <Link to="/about">about</Link>
          <Link to="/contact">contact</Link>
          <Link to="/dashboard">dashboard</Link>
          <Link to={mockSrpRoute}>Search Results</Link>
        </nav>
        <Router>
          <Home path="/" />
          <About path="/about" />
          <Contact path="/contact" />
          <Dashboard path="/dashboard" />
          {/* MATCHES WHEN ANYTHING ELSE EXISTS PAST THE TOP LEVEL '/' */}
          <SearchResults path="/*" />
        </Router>
      </Page>
    );
  }
}

export default App;
