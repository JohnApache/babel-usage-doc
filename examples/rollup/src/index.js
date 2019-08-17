import {someA} from './dependA';
import someB from './dependB';
import _ from 'lodash';

const a = [1,2,3].includes(3);
const b = new Map();
const c = new Set();
console.log(a, b, c);
someA();
someB();
_.join(['Hello', 'webpack'], ' ')