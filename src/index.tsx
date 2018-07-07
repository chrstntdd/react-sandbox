import React from 'react';
import { render } from 'react-dom';

import App from '@/ui/App';

/* GLOBAL SINGLE USE UTILITY CLASSES */
import s from '@/styles/index.css';
(() => s)();

render(<App />, document.getElementById('root'));
