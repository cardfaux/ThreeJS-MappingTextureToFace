import express from 'express';
import logger from 'morgan';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import errorHandler from 'errorhandler';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (() => {
  const app = express();

  app.set('views', path.join(__dirname, '../../client/views'));
  app.set('view engine', 'pug');

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  if (process.env.NODE_ENV === 'development') {
    app.use(errorHandler());
  }
  app.use(express.static(path.join(__dirname, '../../__dist')));

  return app;
})();
