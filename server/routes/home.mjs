import { client } from '../config/prismicConfig.mjs';
import { handleRequest } from './config/prismicRequest.mjs';

/*
===============================================================================
ROUTES
===============================================================================
*/
export const homePage = async (req, res) => {
  const defaults = await handleRequest(client);

  res.render('pages/home', {
    ...defaults,
  });
};
