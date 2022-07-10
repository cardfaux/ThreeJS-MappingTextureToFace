/*
===============================================================================
IMPORTS
===============================================================================
*/
import 'dotenv/config';
import app from './config/expressConfig.mjs';
const port = process.env.PORT || 4000;

// prismic imports
import * as prismicH from '@prismicio/helpers';

import UAParser from 'ua-parser-js';

import { homePage } from './routes/home.mjs';

/*
===============================================================================
PRISMIC LINK RESOLVER
===============================================================================
*/
const handleLinkResolver = (doc) => {
  // if (doc.type === "product") {
  //   return `/detail/${doc.slug}`;
  // }
  // if (doc.type === "collections") {
  //   return "/collections";
  // }
  // if (doc.type === "about") {
  //   return "/about";
  // }

  return '/';
};

/*
===============================================================================
PRISMIC MIDDLEWARE
===============================================================================
*/
app.use((req, res, next) => {
  const ua = UAParser(req.headers['user-agent']);

  res.locals.isDesktop = ua.device.type === undefined;
  res.locals.isPhone = ua.device.type === 'mobile';
  res.locals.isTablet = ua.device.type === 'tablet';

  res.locals.Link = handleLinkResolver;

  res.locals.Numbers = (index) => {
    return index == 0 ? 'One' : index == 1 ? 'Two' : index == 2 ? 'Three' : index == 3 ? 'Four' : '';
  };

  res.locals.PrismicHelpers = {
    prismicH,
  };

  next();
});

/*
===============================================================================
ROUTES
===============================================================================
*/
app.get('/', homePage);

/*
===============================================================================
START THE EXPRESS SERVER
===============================================================================
*/
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
