import sanityClient from "../client";

export const fetcher = async (query) => {
  return sanityClient.fetch(query);
};
