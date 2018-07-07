import React, { Component } from 'react';

import { Router, Link } from '@/Router';
import Page from '@/ui/components/Page';

import generateLazyComponent from '@/ui/components/LazyComponent';

import s from '@/ui/App.css';

const About = generateLazyComponent(() => import('@/ui/pages/About'));
const Home = generateLazyComponent(() => import('@/ui/pages/Home'));
const Contact = generateLazyComponent(() => import('@/ui/pages/Contact'));
const Dashboard = generateLazyComponent(() => import('@/ui/pages/Dashboard'));

/**
 * @description CURRENT CODE SPLITTING IMPLEMENTATION SPLITS
 * AT THE TOP LEVEL, BUT IT CAN BE DONE LOWER DOWN IN THE TREE
 * AS WELL OR ON AN INDIVIDUAL COMPONENT LEVEL.
 */
class App extends Component {
  render() {
    return (
      <Page>
        <nav className={`${s.navContainer} flex justify-center`}>
          <Link to="/">Home</Link>
          <Link to="/about">about</Link>
          <Link to="/contact">contact</Link>
          <Link to="/dashboard">dashboard</Link>
        </nav>
        <Router>
          <Home path="/" />
          <About path="/about" />
          <Contact path="/contact" />
          <Dashboard path="/dashboard" />
        </Router>
      </Page>
    );
  }
}

export default App;
