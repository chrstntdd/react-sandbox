import React, { Component } from 'react';

import s from '@/ui/index.css';

import { Router, Link } from '@/Router';

class Home extends Component {
  render() {
    return <div className="home">Home</div>;
  }
}
class About extends Component {
  render() {
    return <div className="About">About</div>;
  }
}
class Contact extends Component {
  render() {
    return <div className="Contact">Contact</div>;
  }
}

class App extends Component {
  render() {
    return (
      <div className={s.main}>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">about</Link>
          <Link to="/contact">contact</Link>
        </nav>
        <Router>
          <Home path="/" />
          <About path="/about" />
          <Contact path="/contact" />
        </Router>
      </div>
    );
  }
}

export default App;
