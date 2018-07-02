import React from 'react';
import Task from 'data.task';

import 'jest-dom/extend-expect';
import { render, cleanup, waitForElement } from 'react-testing-library';

import RemoteDataFetcher from './';

jest.useFakeTimers();

const fakeFetchSuccess = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve('data'), 0);
  });

const fakeFetchFailure = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => reject('error'), 0);
  });

const MockTask = new Task((reject, resolve) => {
  fakeFetchSuccess()
    .then(resolve)
    .catch(reject);
});

const requiredProps = {
  task: MockTask,
  handleTask: {
    notAsked: jest.fn(() => <div>Nothing loaded</div>),
    loading: jest.fn(() => <div>Loading...</div>),
    error: jest.fn(error => <div>Something went wrong: {error}</div>),
    success: jest.fn(data => <div>Got yer data: {data}</div>)
  }
};

afterEach(() => {
  cleanup();

  requiredProps.handleTask.notAsked.mockClear();
  requiredProps.handleTask.loading.mockClear();
  requiredProps.handleTask.error.mockClear();
  requiredProps.handleTask.success.mockClear();
});

test('RemoteDataFetcher should be in a success state after the async data has resolved', async () => {
  const { getByText, container } = render(<RemoteDataFetcher {...requiredProps} />);

  expect(getByText('Loading...')).toBeInTheDOM();

  jest.runAllTimers(); // trigger the mocked fakeFetchSuccess

  await waitForElement(() => getByText('Loading...'), { container });

  expect(getByText(/Got yer data:/i)).toBeInTheDOM();
  expect(requiredProps.handleTask.notAsked).toHaveBeenCalledTimes(1);
  expect(requiredProps.handleTask.loading).toHaveBeenCalledTimes(1);
  expect(requiredProps.handleTask.error).toHaveBeenCalledTimes(0);
  expect(requiredProps.handleTask.success).toHaveBeenCalledTimes(1);
});

test('RemoteDataFetcher should be in an error state after the async data has rejected', async () => {
  const localRequiredProps = {
    ...requiredProps,
    task: new Task((reject, resolve) => {
      fakeFetchFailure()
        .then(resolve)
        .catch(reject);
    })
  };
  const { getByText, container } = render(<RemoteDataFetcher {...localRequiredProps} />);

  expect(getByText('Loading...')).toBeInTheDOM();

  jest.runAllTimers(); // trigger the mocked fakeFetchFailure

  await waitForElement(() => getByText('Loading...'), { container });

  expect(getByText(/Something went wrong:/i)).toBeInTheDOM();
  expect(requiredProps.handleTask.notAsked).toHaveBeenCalledTimes(1);
  expect(requiredProps.handleTask.loading).toHaveBeenCalledTimes(1);
  expect(requiredProps.handleTask.error).toHaveBeenCalledTimes(1);
  expect(requiredProps.handleTask.success).toHaveBeenCalledTimes(0);
});
