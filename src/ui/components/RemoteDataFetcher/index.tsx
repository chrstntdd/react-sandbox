import React, { Component } from 'react';
import Task from 'data.task';

const NOT_ASKED = 'NOT_ASKED';
const LOADING = 'LOADING';
const SUCCESS = 'SUCCESS';
const ERROR = 'ERROR';

const fold = (type, data = null) => o => o[type](data);

const Data = {
  notAsked: () => ({ type: NOT_ASKED, transformation: fold(NOT_ASKED) }),
  loading: () => ({ type: LOADING, transformation: fold(LOADING) }),
  error: error => ({ type: ERROR, error, transformation: fold(ERROR, error) }),
  success: data => ({ type: SUCCESS, data, transformation: fold(SUCCESS, data) })
};

interface PRemoteDataFetcher {
  handleTask: {
    notAsked: () => JSX.Element;
    loading: () => JSX.Element;
    error: (error: any) => JSX.Element;
    success: (data: any) => JSX.Element;
  };
  task: Task;
}

interface SRemoteDataFetcher {
  type: string;
  transformation: (o) => any;
  data?: any;
  error?: any;
}

/**
 * @description To encapsulate data fetching that must be performed
 * before the UI has all the data available to render the content.
 *
 * The data fetching is modeled with a Task instead of a promise to
 * better represent the state of the content that will be rendered
 * to the user.
 *
 * State can exist in only 1 of 4 possible outcomes:
 * `notAsked -> loading -> error || success`
 *
 * For more information on the difference between a Task and a Promise,
 * see: https://glebbahmutov.com/blog/difference-between-promise-and-task/
 */
class RemoteDataFetcher extends Component<PRemoteDataFetcher, SRemoteDataFetcher> {
  state = Data.notAsked();

  componentDidMount() {
    this.setState(Data.loading(), () => this.forkTask());
  }

  forkTask() {
    this.props.task.fork(
      error => this.setState(Data.error(error)),
      data => this.setState(Data.success(data))
    );
  }

  render() {
    const { handleTask } = this.props;

    return this.state.transformation({
      NOT_ASKED: handleTask.notAsked,
      LOADING: handleTask.loading,
      ERROR: handleTask.error,
      SUCCESS: handleTask.success
    });
  }
}

export default RemoteDataFetcher;
