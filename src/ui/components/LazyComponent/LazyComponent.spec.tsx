import React from 'react';

import 'jest-dom/extend-expect';
import { render, cleanup, waitForElement } from 'react-testing-library';

import generateLazyComponent from './';

afterEach(cleanup);

test('Should render the imported component just like normal', async () => {
  const MockComponent = generateLazyComponent(() => import('./MockComponent'));

  const { getByText, container } = render(<MockComponent />);

  await waitForElement(() => getByText('Mock'), { container });

  expect(getByText('Mock')).toBeInTheDOM();
});
