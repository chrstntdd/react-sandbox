import React from 'react';

import 'jest-dom/extend-expect';
import { render, cleanup } from 'react-testing-library';

import App from './App';

afterEach(cleanup);

test('should render content', () => {
  const { getByText } = render(<App />);

  expect(getByText('APP')).toBeInTheDOM();
});
