/*
===============================================================================
DEFAULT REQUEST HANDLER
===============================================================================
*/
export const handleRequest = async (client) => {
  const home = await client.getSingle('home');
  const meta = await client.getSingle('metadata');
  const preloader = await client.getSingle('preloader');
  return {
    home,
    meta,
    preloader,
  };
};
